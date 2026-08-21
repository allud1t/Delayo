import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchItemStatusWithGoogleApi,
  publishExtensionRevisionWithGoogleApi,
  uploadExtensionPackageWithGoogleApi,
} from './chrome-web-store-google.mjs';

const mocks = vi.hoisted(() => ({
  fetchStatus: vi.fn(),
  publish: vi.fn(),
  upload: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class OAuth2 {
        setCredentials(credentials) {
          this.credentials = credentials;
        }
      },
    },
    chromewebstore: mocks.createClient,
  },
}));

describe('chrome-web-store-google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue({
      media: { upload: mocks.upload },
      publishers: {
        items: {
          fetchStatus: mocks.fetchStatus,
          publish: mocks.publish,
        },
      },
    });
  });

  it('uploads with the generated Chrome Web Store v2 client', async () => {
    mocks.upload.mockResolvedValue({
      data: { itemId: 'extension-456', uploadState: 'SUCCEEDED' },
    });
    const zipBuffer = Buffer.from('zip-binary');

    const result = await uploadExtensionPackageWithGoogleApi({
      accessToken: 'token-123',
      publisherId: 'publisher-123',
      extensionId: 'extension-456',
      zipBuffer,
    });

    expect(mocks.createClient).toHaveBeenCalledWith({
      version: 'v2',
      auth: expect.objectContaining({
        credentials: { access_token: 'token-123' },
      }),
    });
    expect(mocks.upload).toHaveBeenCalledWith({
      name: 'publishers/publisher-123/items/extension-456',
      requestBody: {},
      media: {
        mimeType: 'application/zip',
        body: zipBuffer,
      },
    });
    expect(result).toEqual({
      url: 'https://chromewebstore.googleapis.com/upload/v2/publishers/publisher-123/items/extension-456:upload',
      version: 'v2',
      body: { itemId: 'extension-456', uploadState: 'SUCCEEDED' },
    });
  });

  it('fetches status through the generated client', async () => {
    mocks.fetchStatus.mockResolvedValue({
      data: { name: 'publishers/publisher-123/items/extension-456' },
    });

    const result = await fetchItemStatusWithGoogleApi({
      accessToken: 'token-123',
      publisherId: 'publisher-123',
      extensionId: 'extension-456',
    });

    expect(mocks.fetchStatus).toHaveBeenCalledWith({
      name: 'publishers/publisher-123/items/extension-456',
    });
    expect(result.body).toEqual({
      name: 'publishers/publisher-123/items/extension-456',
    });
  });

  it('preserves the API status and body when a request is denied', async () => {
    mocks.publish.mockRejectedValue({
      code: 403,
      response: {
        data: { error: { message: 'permission denied' } },
        status: 403,
      },
    });

    await expect(
      publishExtensionRevisionWithGoogleApi({
        accessToken: 'token-123',
        publisherId: 'publisher-123',
        extensionId: 'extension-456',
      })
    ).rejects.toThrow(
      'Chrome Web Store publish failed (403). {\n  "error": {\n    "message": "permission denied"\n  }\n}'
    );
  });
});
