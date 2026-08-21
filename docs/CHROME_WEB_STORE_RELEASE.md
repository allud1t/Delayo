# Chrome Web Store Release Runbook

## What this pipeline does

The release workflow validates the project, builds the extension, packages the `dist/` contents into a Chrome Web Store zip, and then uses the official Chrome Web Store API to either:

- stop after validation,
- upload the zip only, or
- upload and submit the revision for review.

The workflow file is [chrome-publish.yml](</D:/pessoais/Delayo/Delayo/.github/workflows/chrome-publish.yml>).

## One-time Chrome Web Store prerequisites

Before automation can publish an existing extension:

1. The extension must already exist in the Chrome Web Store.
2. The listing and privacy sections must already be configured in the dashboard.
3. The Google account or publisher must have 2-step verification enabled.

Reference: [Chrome Web Store API guide](https://developer.chrome.com/docs/webstore/using-api).

## Recommended authentication model

Use a service account connected to the Chrome Web Store publisher and authenticate GitHub Actions through Workload Identity Federation.

Reference setup docs:

- [Chrome Web Store service accounts](https://developer.chrome.com/docs/webstore/service-accounts)
- [google-github-actions/auth](https://github.com/google-github-actions/auth)
- [GitHub OIDC for Google Cloud](https://docs.github.com/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-google-cloud-platform)

## GitHub environment

Create a protected GitHub Actions environment named `chrome-web-store`.

Store the following secrets there:

- `CWS_EXTENSION_ID`
- `CWS_PUBLISHER_ID`
- `CWS_SERVICE_ACCOUNT_EMAIL`
- `CWS_WORKLOAD_IDENTITY_PROVIDER`

Optional fallback secret:

- `CWS_SERVICE_ACCOUNT_KEY_JSON`

The workflow prefers Workload Identity Federation. The JSON key is only used if WIF is not configured.

## Supported release modes

### `validate_only`

- Runs install, lint, tests, build, and packaging.
- Does not call the Chrome Web Store API.

### `upload_only`

- Runs full validation.
- Uploads the package to the store.
- Does not submit the revision for review.

### `upload_and_publish`

- Runs full validation.
- Uploads the package.
- Submits the uploaded revision for review through the Chrome Web Store API.

## How to run

### Manual validation

1. Open GitHub Actions.
2. Run `Chrome Web Store Release`.
3. Choose `validate_only`.

### Manual upload without publishing

1. Open GitHub Actions.
2. Run `Chrome Web Store Release`.
3. Choose `upload_only`.

### Normal release

1. Bump the version in `package.json` using your normal release flow.
2. Confirm the changelog and release notes are ready.
3. Create and push tag `vX.Y.Z`.
4. The workflow will validate, package, upload, and submit the revision for review.

## Local commands

```bash
pnpm lint
pnpm test
pnpm build
pnpm zip
pnpm release:validate -- --event-name workflow_dispatch
```

## Notes

- The release artifact is uploaded to the GitHub Actions run for traceability.
- Tag pushes must match `package.json`. A mismatched tag fails before upload.
- The Chrome Web Store still controls review and final availability.
