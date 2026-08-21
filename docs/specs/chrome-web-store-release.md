# Chrome Web Store Release Pipeline Spec

## Summary

Delayo needs a repeatable release pipeline that validates the extension, packages the production build exactly as the Chrome Web Store expects, and submits updates through the official Chrome Web Store API without relying on an unreviewed third-party publish action.

## Problem

The repository already has CI and a publish workflow, but the release path has four gaps:

1. The Chrome Web Store workflow uploads with a third-party action pinned to `@main`.
2. The workflow does not explicitly gate upload/publish on the same lint/test/build sequence used for CI.
3. Versioning is duplicated between `package.json` and `src/manifest.ts`.
4. The repository has no first-party runbook describing the secrets, authentication model, and supported release modes.

## Goals

1. Make `package.json` the single source of truth for the extension version.
2. Fail tag releases when the pushed tag does not match the package version.
3. Run lint, unit tests, and build before any Chrome Web Store API call.
4. Package the `dist/` contents into a release zip that can be uploaded directly.
5. Upload and optionally publish through the official Chrome Web Store API v2.
6. Prefer Workload Identity Federation and service accounts over user refresh tokens.
7. Keep a manual validation mode that exercises the pipeline without mutating the store.
8. Keep release artifacts attached to the workflow run for auditability.

## Non-goals

1. Bypass Chrome Web Store review.
2. Automate listing text, screenshots, privacy form editing, or first-time store setup.
3. Add end-to-end browser automation for the extension UI in this change.

## Constraints

1. The first store listing and privacy setup still have to exist in the Chrome Web Store dashboard.
2. Chrome Web Store publish API calls submit a revision for review; they do not guarantee immediate availability.
3. The repository already uses pnpm, Vite, Vitest, and GitHub Actions, so the release flow should stay within those tools.

## Design

### Versioning

- `src/manifest.ts` reads the version from `package.json`.
- A release validation script checks that a pushed `vX.Y.Z` tag matches `package.json`.

### Packaging

- The production build remains `pnpm build`.
- A first-party PowerShell packaging script zips the contents of `dist/` into `artifacts/delayo-chrome-web-store-<version>.zip`.
- The zip is uploaded as a workflow artifact on every release run.

### Chrome Web Store API integration

- A first-party Node script uploads the release zip through `upload/v2/publishers/*/items/*:upload`.
- The same script can optionally submit the uploaded revision with `v2/publishers/*/items/*:publish`.
- Status fetches are best-effort and used for observability, not as a separate source of truth.

### Authentication

- Preferred path: GitHub OIDC -> Google Workload Identity Federation -> service account -> Chrome Web Store API access token.
- Supported fallback: GitHub secret containing a service account key JSON.
- Rejected path: refresh-token based workflow credentials stored long-term in the repository.

### Workflow modes

- `validate_only`: runs lint, tests, build, and packaging. No store mutation.
- `upload_only`: runs full validation and uploads the zip to the store without submitting for review.
- `upload_and_publish`: runs full validation, uploads the zip, and submits the revision for review.
- Tag pushes always run `upload_and_publish`.

## Security model

1. All GitHub Actions are pinned by commit SHA.
2. Chrome Web Store upload/publish uses the official API, not an opaque wrapper action.
3. Store credentials live in a protected GitHub environment.
4. Workload Identity Federation is preferred because it avoids long-lived JSON keys.
5. The release pipeline never runs before lint, tests, and build pass in the same job.

## Acceptance criteria

1. `pnpm lint`, `pnpm test`, and `pnpm build` pass locally after the change.
2. The release workflow fails when a pushed tag version does not match `package.json`.
3. The workflow can package a valid Chrome Web Store zip from `dist/`.
4. The workflow can skip store calls in `validate_only` mode.
5. The workflow can upload through the official API in `upload_only` mode.
6. The workflow can upload and submit for review in `upload_and_publish` mode.
7. A repository maintainer can set up the environment and secrets using a single documented runbook.

## Rollout plan

1. Merge the release engineering changes.
2. Configure the `chrome-web-store` GitHub environment and secrets.
3. Run `workflow_dispatch` with `validate_only`.
4. Run `workflow_dispatch` with `upload_only`.
5. Create a `vX.Y.Z` tag only after the first two runs succeed.
