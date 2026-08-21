import { describe, expect, it } from 'vitest';

import {
  buildArchiveFileName,
  normalizeTagVersion,
  validateReleaseVersion,
} from './project-metadata.mjs';

describe('project-metadata', () => {
  it('normalizes a semantic tag to a package version', () => {
    expect(normalizeTagVersion('v1.2.3')).toBe('1.2.3');
    expect(normalizeTagVersion('1.2.3')).toBe('1.2.3');
    expect(normalizeTagVersion('')).toBeNull();
  });

  it('builds the chrome web store archive name from the version', () => {
    expect(buildArchiveFileName('1.2.3')).toBe('delayo-chrome-web-store-1.2.3.zip');
  });

  it('rejects a pushed tag that does not match package.json', () => {
    expect(() =>
      validateReleaseVersion({
        packageVersion: '1.2.3',
        eventName: 'push',
        refName: 'v1.2.4',
      })
    ).toThrow('does not match package.json version');
  });

  it('accepts manual runs without a tag', () => {
    expect(
      validateReleaseVersion({
        packageVersion: '1.2.3',
        eventName: 'workflow_dispatch',
        refName: '',
      })
    ).toEqual({
      packageVersion: '1.2.3',
      refVersion: null,
    });
  });
});
