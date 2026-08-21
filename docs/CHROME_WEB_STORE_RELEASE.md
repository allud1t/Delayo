# Chrome Web Store Release Runbook

## What this pipeline does

The release workflow validates the project, builds the extension, packages the `dist/` contents into a Chrome Web Store zip, and then uses the official Chrome Web Store API to either:

- stop after validation,
- upload the zip only, or
- upload and submit the revision for review.

The workflow file is [`.github/workflows/chrome-publish.yml`](../.github/workflows/chrome-publish.yml).

---

## Authentication Models

The pipeline supports **two official authentication modes**:

### 1. OAuth2 Refresh Token Flow (Active and configured)

This mode uses standard Google OAuth2 credentials stored directly in GitHub repository secrets:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_EXTENSION_ID`

The workflow automatically exchanges the refresh token for a short-lived `access_token` with Google OAuth. With no `CWS_PUBLISHER_ID`, the script uses the compatible Chrome Web Store API v1.1 path.

### 2. Google Cloud Service Account / Workload Identity Federation

For organizations using GCP Service Accounts:

- `CWS_EXTENSION_ID`
- `CWS_PUBLISHER_ID`
- `CWS_SERVICE_ACCOUNT_EMAIL`
- `CWS_WORKLOAD_IDENTITY_PROVIDER` (or `CWS_SERVICE_ACCOUNT_KEY_JSON`)

When these values are present, the workflow uses a short-lived access token from the service account instead of the OAuth refresh-token fallback. If `CWS_PUBLISHER_ID` is also present, the script uses the Chrome Web Store API v2 endpoints.

---

## Supported Release Modes

### `validate_only`

- Runs install, lint, tests, build, and packaging.
- Does not call the Chrome Web Store API.

### `upload_only`

- Runs full validation.
- Uploads the package to the Chrome Web Store as a draft.
- Does not submit for review.

### `upload_and_publish` (Default on Git Tag)

- Runs full validation.
- Uploads the package to the Chrome Web Store.
- Submits the revision for review.

---

## How to Trigger a Release

### Automatic Release on Git Tag

```bash
git tag v1.3.0
git push origin v1.3.0
```

### Manual Trigger via GitHub Actions UI

1. Go to **Actions > Chrome Web Store Release**.
2. Click **Run workflow**.
3. Select the branch (`main`) and desired `release_mode` (`validate_only`, `upload_only`, or `upload_and_publish`).
