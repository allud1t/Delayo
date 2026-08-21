import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function readPackageVersion(projectRoot = process.cwd()) {
  const packageJsonPath = path.resolve(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  if (typeof packageJson.version !== 'string' || packageJson.version.length === 0) {
    throw new Error(`Could not read a valid version from ${packageJsonPath}.`);
  }

  return packageJson.version;
}

export function normalizeTagVersion(tagName) {
  if (!tagName) {
    return null;
  }

  return tagName.startsWith('v') ? tagName.slice(1) : tagName;
}

export function buildArchiveFileName(version, prefix = 'delayo-chrome-web-store') {
  if (!version) {
    throw new Error('A version is required to build the release archive name.');
  }

  return `${prefix}-${version}.zip`;
}

export function validateReleaseVersion({ packageVersion, eventName, refName }) {
  if (!packageVersion) {
    throw new Error('packageVersion is required.');
  }

  const refVersion = normalizeTagVersion(refName);

  if (eventName === 'push' && refName?.startsWith('v') && refVersion !== packageVersion) {
    throw new Error(
      `Release tag "${refName}" does not match package.json version "${packageVersion}".`
    );
  }

  return {
    packageVersion,
    refVersion,
  };
}

export function appendGitHubOutput(outputPath, entries) {
  if (!outputPath) {
    return;
  }

  const lines = Object.entries(entries).map(([key, value]) => `${key}=${value}`);
  appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}
