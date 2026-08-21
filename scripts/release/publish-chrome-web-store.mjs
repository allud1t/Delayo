import { appendFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  fetchItemStatus,
  fetchOAuthAccessToken,
  parseBoolean,
  publishExtensionRevision,
  uploadExtensionPackage,
} from './lib/chrome-web-store.mjs';

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is required.`);
  }

  return value;
}

function appendStepSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  appendFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');
}

function assertUploadSucceeded(body) {
  if (body?.uploadState !== 'FAILURE') {
    return;
  }

  const details = Array.isArray(body.itemError)
    ? body.itemError.join('; ')
    : JSON.stringify(body);
  throw new Error(`Chrome Web Store rejected the upload: ${details}`);
}

async function tryFetchStatus(params, label) {
  try {
    return await fetchItemStatus(params);
  } catch (error) {
    console.warn(`${label} status fetch failed:`, error);
    return null;
  }
}

async function resolveAccessToken() {
  if (process.env.CWS_ACCESS_TOKEN) {
    return process.env.CWS_ACCESS_TOKEN;
  }

  const clientId = process.env.CWS_CLIENT_ID;
  const clientSecret = process.env.CWS_CLIENT_SECRET;
  const refreshToken = process.env.CWS_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    console.log(
      'Exchanging OAuth2 refresh token for Chrome Web Store access token...'
    );
    return await fetchOAuthAccessToken({
      clientId,
      clientSecret,
      refreshToken,
    });
  }

  throw new Error(
    'No valid authentication provided. Supply CWS_ACCESS_TOKEN or (CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN).'
  );
}

async function main() {
  const accessToken = await resolveAccessToken();
  const extensionId = requireEnv('CWS_EXTENSION_ID');
  const publisherId = process.env.CWS_PUBLISHER_ID || undefined;
  const zipFile = path.resolve(requireEnv('CWS_ZIP_FILE'));
  const shouldPublish = parseBoolean(process.env.CWS_PUBLISH, false);

  if (!existsSync(zipFile)) {
    throw new Error(`Release archive not found: ${zipFile}`);
  }

  const zipBuffer = await readFile(zipFile);
  console.log(
    `Uploading release package to Chrome Web Store (Extension ID: ${extensionId})...`
  );
  const uploadResult = await uploadExtensionPackage({
    accessToken,
    extensionId,
    publisherId,
    zipBuffer,
  });
  console.log('Upload result:', JSON.stringify(uploadResult.body, null, 2));
  assertUploadSucceeded(uploadResult.body);

  const statusAfterUpload = await tryFetchStatus(
    {
      accessToken,
      extensionId,
      publisherId,
    },
    'Upload'
  );

  let publishResult = null;
  let statusAfterPublish = null;

  if (shouldPublish) {
    console.log('Submitting extension for review/publish...');
    publishResult = await publishExtensionRevision({
      accessToken,
      extensionId,
      publisherId,
    });
    console.log('Publish result:', JSON.stringify(publishResult.body, null, 2));

    statusAfterPublish = await tryFetchStatus(
      {
        accessToken,
        extensionId,
        publisherId,
      },
      'Publish'
    );
  }

  const output = {
    extensionId,
    publisherId: publisherId || 'none (v1.1 API)',
    publishSubmitted: shouldPublish,
    zipFile,
    uploadResult: uploadResult.body,
    statusAfterUpload: statusAfterUpload?.body ?? null,
    publishResult: publishResult?.body ?? null,
    statusAfterPublish: statusAfterPublish?.body ?? null,
  };

  console.log('Release execution summary:');
  console.log(JSON.stringify(output, null, 2));

  const summaryLines = [
    '## Chrome Web Store Release',
    '',
    `- Archive: \`${zipFile}\``,
    `- Extension ID: \`${extensionId}\``,
    `- API Mode: \`${publisherId ? 'v2 (Publisher)' : 'v1.1 (OAuth2)'}\``,
    `- Upload completed: \`yes\``,
    `- Publish submitted: \`${shouldPublish ? 'yes' : 'no'}\``,
  ];

  appendStepSummary(summaryLines);
}

main().catch((error) => {
  console.error('Release failed:', error);
  process.exitCode = 1;
});
