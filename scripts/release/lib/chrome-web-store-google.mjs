import { Readable } from 'node:stream';
import { google } from 'googleapis';

import { buildItemName } from './chrome-web-store.mjs';

const CHROME_WEB_STORE_BASE_URL = 'https://chromewebstore.googleapis.com';
const CHROME_WEB_STORE_SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

function assertNonEmpty(value, label) {
  if (!value || typeof value !== 'string') {
    throw new Error(`${label} is required.`);
  }
}

function createChromeWebStoreClient(accessToken) {
  assertNonEmpty(accessToken, 'accessToken');

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.chromewebstore({
    version: 'v2',
    auth,
  });
}

function renderErrorBody(error) {
  const body = error?.response?.data;

  if (body == null) {
    return error instanceof Error ? error.message : String(error);
  }

  return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
}

function wrapApiError(context, error) {
  const status = error?.response?.status ?? error?.code;
  const statusSuffix = status ? ` (${status})` : '';
  return new Error(
    `${context} failed${statusSuffix}. ${renderErrorBody(error)}`,
    { cause: error }
  );
}

function buildV2Url(itemName, action) {
  const prefix = action === 'upload' ? '/upload/v2' : '/v2';
  const suffix = action === 'upload' ? ':upload' : `:${action}`;
  return `${CHROME_WEB_STORE_BASE_URL}${prefix}/${itemName}${suffix}`;
}

export async function uploadExtensionPackageWithGoogleApi({
  accessToken,
  publisherId,
  extensionId,
  zipBuffer,
}) {
  assertNonEmpty(publisherId, 'publisherId');
  assertNonEmpty(extensionId, 'extensionId');

  if (!(zipBuffer instanceof Uint8Array)) {
    throw new Error('zipBuffer must be a Buffer or Uint8Array.');
  }

  const itemName = buildItemName(publisherId, extensionId);
  const client = createChromeWebStoreClient(accessToken);

  try {
    const response = await client.media.upload({
      name: itemName,
      requestBody: {},
      media: {
        mimeType: 'application/zip',
        body: Readable.from([zipBuffer]),
      },
    });

    return {
      url: buildV2Url(itemName, 'upload'),
      version: 'v2',
      body: response.data,
    };
  } catch (error) {
    throw wrapApiError('Chrome Web Store upload', error);
  }
}

export async function publishExtensionRevisionWithGoogleApi({
  accessToken,
  publisherId,
  extensionId,
}) {
  assertNonEmpty(publisherId, 'publisherId');
  assertNonEmpty(extensionId, 'extensionId');

  const itemName = buildItemName(publisherId, extensionId);
  const client = createChromeWebStoreClient(accessToken);

  try {
    const response = await client.publishers.items.publish({
      name: itemName,
      requestBody: {},
    });

    return {
      url: buildV2Url(itemName, 'publish'),
      version: 'v2',
      body: response.data,
    };
  } catch (error) {
    throw wrapApiError('Chrome Web Store publish', error);
  }
}

export async function fetchItemStatusWithGoogleApi({
  accessToken,
  publisherId,
  extensionId,
}) {
  assertNonEmpty(publisherId, 'publisherId');
  assertNonEmpty(extensionId, 'extensionId');

  const itemName = buildItemName(publisherId, extensionId);
  const client = createChromeWebStoreClient(accessToken);

  try {
    const response = await client.publishers.items.fetchStatus({
      name: itemName,
    });

    return {
      url: buildV2Url(itemName, 'fetchStatus'),
      version: 'v2',
      body: response.data,
    };
  } catch (error) {
    throw wrapApiError('Chrome Web Store status fetch', error);
  }
}

export { CHROME_WEB_STORE_SCOPE };
