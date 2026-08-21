import { URLSearchParams } from 'node:url';

const CHROME_WEB_STORE_V2_BASE_URL = 'https://chromewebstore.googleapis.com';
const CHROME_WEB_STORE_V1_BASE_URL = 'https://www.googleapis.com';
const GOOGLE_OAUTH2_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function assertNonEmpty(value, label) {
  if (!value || typeof value !== 'string') {
    throw new Error(`${label} is required.`);
  }
}

async function parseResponseBody(response) {
  const bodyText = await response.text();

  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return bodyText;
  }
}

async function ensureSuccess(response, context) {
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const renderedBody =
      typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    throw new Error(
      `${context} failed (${response.status} ${response.statusText}). ${renderedBody}`
    );
  }

  return body;
}

export function parseBoolean(value, defaultValue = false) {
  if (value == null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

export async function fetchOAuthAccessToken({
  clientId,
  clientSecret,
  refreshToken,
  fetchImpl = fetch,
}) {
  assertNonEmpty(clientId, 'clientId');
  assertNonEmpty(clientSecret, 'clientSecret');
  assertNonEmpty(refreshToken, 'refreshToken');

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetchImpl(GOOGLE_OAUTH2_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await ensureSuccess(response, 'Google OAuth token refresh');

  if (!data?.access_token) {
    throw new Error(
      `No access_token returned by Google OAuth: ${JSON.stringify(data)}`
    );
  }

  return data.access_token;
}

export function buildItemName(publisherId, extensionId) {
  assertNonEmpty(publisherId, 'publisherId');
  assertNonEmpty(extensionId, 'extensionId');

  return `publishers/${publisherId}/items/${extensionId}`;
}

export function buildChromeWebStoreUrls({ publisherId, extensionId }) {
  assertNonEmpty(extensionId, 'extensionId');

  if (publisherId) {
    const itemName = buildItemName(publisherId, extensionId);
    return {
      version: 'v2',
      itemName,
      upload: `${CHROME_WEB_STORE_V2_BASE_URL}/upload/v2/${itemName}:upload`,
      publish: `${CHROME_WEB_STORE_V2_BASE_URL}/v2/${itemName}:publish`,
      status: `${CHROME_WEB_STORE_V2_BASE_URL}/v2/${itemName}:fetchStatus`,
    };
  }

  return {
    version: 'v1.1',
    itemName: extensionId,
    upload: `${CHROME_WEB_STORE_V1_BASE_URL}/upload/chromewebstore/v1.1/items/${extensionId}?uploadType=media`,
    publish: `${CHROME_WEB_STORE_V1_BASE_URL}/chromewebstore/v1.1/items/${extensionId}/publish`,
    status: `${CHROME_WEB_STORE_V1_BASE_URL}/chromewebstore/v1.1/items/${extensionId}?projection=DRAFT`,
  };
}

export async function uploadExtensionPackage({
  accessToken,
  publisherId,
  extensionId,
  zipBuffer,
  fetchImpl = fetch,
}) {
  assertNonEmpty(accessToken, 'accessToken');
  assertNonEmpty(extensionId, 'extensionId');

  if (!(zipBuffer instanceof Uint8Array)) {
    throw new Error('zipBuffer must be a Buffer or Uint8Array.');
  }

  const urls = buildChromeWebStoreUrls({ publisherId, extensionId });
  const isV2 = urls.version === 'v2';

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/zip',
  };

  if (!isV2) {
    headers['x-goog-api-version'] = '2';
  }

  const response = await fetchImpl(urls.upload, {
    method: isV2 ? 'POST' : 'PUT',
    headers,
    body: zipBuffer,
  });

  return {
    url: urls.upload,
    version: urls.version,
    body: await ensureSuccess(response, 'Chrome Web Store upload'),
  };
}

export async function publishExtensionRevision({
  accessToken,
  publisherId,
  extensionId,
  fetchImpl = fetch,
}) {
  assertNonEmpty(accessToken, 'accessToken');
  assertNonEmpty(extensionId, 'extensionId');

  const urls = buildChromeWebStoreUrls({ publisherId, extensionId });
  const isV2 = urls.version === 'v2';

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (!isV2) {
    headers['x-goog-api-version'] = '2';
    headers['Content-Length'] = '0';
  }

  const response = await fetchImpl(urls.publish, {
    method: 'POST',
    headers,
  });

  return {
    url: urls.publish,
    version: urls.version,
    body: await ensureSuccess(response, 'Chrome Web Store publish'),
  };
}

export async function fetchItemStatus({
  accessToken,
  publisherId,
  extensionId,
  fetchImpl = fetch,
}) {
  assertNonEmpty(accessToken, 'accessToken');
  assertNonEmpty(extensionId, 'extensionId');

  const urls = buildChromeWebStoreUrls({ publisherId, extensionId });
  const isV2 = urls.version === 'v2';

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (!isV2) {
    headers['x-goog-api-version'] = '2';
  }

  const response = await fetchImpl(urls.status, {
    method: 'GET',
    headers,
  });

  return {
    url: urls.status,
    version: urls.version,
    body: await ensureSuccess(response, 'Chrome Web Store status fetch'),
  };
}
