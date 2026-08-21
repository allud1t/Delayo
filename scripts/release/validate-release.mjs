import {
  appendGitHubOutput,
  buildArchiveFileName,
  readPackageVersion,
  validateReleaseVersion,
} from './lib/project-metadata.mjs';

function readArg(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

const eventName = readArg('--event-name') ?? process.env.GITHUB_EVENT_NAME ?? '';
const refName = readArg('--ref-name') ?? process.env.GITHUB_REF_NAME ?? '';
const githubOutput = readArg('--github-output') ?? '';

const version = readPackageVersion();
validateReleaseVersion({
  packageVersion: version,
  eventName,
  refName,
});

const archiveName = buildArchiveFileName(version);

console.log(`Validated release version ${version}.`);
if (refName) {
  console.log(`Release ref: ${refName}`);
}

appendGitHubOutput(githubOutput, {
  archive_name: archiveName,
  version,
});
