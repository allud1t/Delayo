import { describe, expect, it, vi } from 'vitest';

import {
  buildChromeWebStoreUrls,
  fetchOAuthAccessToken,
  parseBoolean,
  publishExtensionRevision,
  uploadExtensionPackage,
} from './chrome-web-store.mjs';

describe('chrome-web-store', () => {
  it('builds the official v2 endpoints when publisherId is present', () => {
    expect(
      buildChromeWebStoreUrls({
        publisherId: 'publisher-123',
        extensionId: 'extension-456',
      })
    ).toEqual({
      version: 'v2',
      itemName: 'publishers/publisher-123/items/extension-456',
      upload:
        'https://chromewebstore.googleapis.com/upload/v2/publishers/publisher-123/items/extension-456:upload',
      publish:
        'https://chromewebstore.googleapis.com/v2/publishers/publisher-123/items/extension-456:publish',
      status:
        'https://chromewebstore.googleapis.com/v2/publishers/publisher-123/items/extension-456:fetchStatus',
    });
  });

  it('builds the classic v1.1 OAuth endpoints when publisherId is omitted', () => {
    expect(
      buildChromeWebStoreUrls({
        extensionId: 'extension-456',
      })
    ).toEqual({
      version: 'v1.1',
      itemName: 'extension-456',
      upload:
        'https://www.googleapis.com/upload/chromewebstore/v1.1/items/extension-456?uploadType=media',
      publish:
        'https://www.googleapis.com/chromewebstore/v1.1/items/extension-456/publish',
      status:
        'https://www.googleapis.com/chromewebstore/v1.1/items/extension-456?projection=DRAFT',
    });
  });

  it('exchanges OAuth2 refresh token for access token', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            access_token: 'new-access-token',
            expires_in: 3600,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
    );

    const token = await fetchOAuthAccessToken({
      clientId: 'client-id-123',
      clientSecret: 'client-secret-456',
      refreshToken: 'refresh-token-789',
      fetchImpl,
    });

    expect(token).toBe('new-access-token');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );
  });

  it('parses boolean workflow inputs and environment flags', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean(undefined, true)).toBe(true);
  });

  it('uploads a zip package with the v1.1 PUT endpoint when publisherId is omitted', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ uploadState: 'SUCCESS' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
    );

    const result = await uploadExtensionPackage({
      accessToken: 'token-123',
      extensionId: 'extension-456',
      zipBuffer: Buffer.from('zip-binary'),
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/chromewebstore/v1.1/items/extension-456?uploadType=media',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/zip',
          'x-goog-api-version': '2',
        }),
      })
    );
    expect(result.body).toEqual({ uploadState: 'SUCCESS' });
  });

  it('raises a useful error when publish fails', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: 'denied' } }), {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'application/json',
          },
        })
    );

    await expect(
      publishExtensionRevision({
        accessToken: 'token-123',
        extensionId: 'extension-456',
        fetchImpl,
      })
    ).rejects.toThrow('Chrome Web Store publish failed');
  });
});
