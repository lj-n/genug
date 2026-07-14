import { describe, expect, it } from 'vitest';

import { computeRelease, nextVersion, stampChangelog } from './calver';

describe('nextVersion', () => {
	it('starts at YYYY.0M.0 when no tags exist', () => {
		expect(nextVersion([], '2026-07-14')).toBe('2026.07.0');
	});

	it('increments the micro for a second release in the same month', () => {
		expect(nextVersion(['2026.07.0'], '2026-07-20')).toBe('2026.07.1');
	});

	it('resets the micro to 0 on the first release of a new month', () => {
		expect(nextVersion(['2026.06.0', '2026.06.1'], '2026-07-01')).toBe('2026.07.0');
	});

	it('derives the next version from the current month, not the highest tag', () => {
		// Tags span June and July; a release cut in June must not continue July's counter.
		expect(nextVersion(['2026.06.0', '2026.07.0', '2026.07.1'], '2026-06-15')).toBe('2026.06.1');
	});

	it('zero-pads the month in the output', () => {
		expect(nextVersion([], '2026-03-09')).toBe('2026.03.0');
	});

	it('finds the highest micro even when tags are unsorted', () => {
		expect(nextVersion(['2026.07.2', '2026.07.0', '2026.07.10', '2026.07.1'], '2026-07-31')).toBe(
			'2026.07.11'
		);
	});

	it('ignores tags that are not CalVer for the current month', () => {
		expect(nextVersion(['v1.0.0', '0.0.1', '2026.07.0', 'stage'], '2026-07-14')).toBe('2026.07.1');
	});

	it('rejects a malformed date', () => {
		expect(() => nextVersion([], '2026-7-1')).toThrow();
		expect(() => nextVersion([], 'not-a-date')).toThrow();
	});
});

describe('stampChangelog', () => {
	const changelog = `# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Dark mode toggle in Settings.

### Fixed

- Admin delete-user no longer preselects the wrong user.

## [2026.06.0] - 2026-06-01

### Added

- Initial account archiving.
`;

	it('renames [Unreleased] to a dated version section and opens a fresh [Unreleased]', () => {
		const result = stampChangelog(changelog, '2026.07.0', '2026-07-14');

		expect(result).toContain('## [Unreleased]');
		expect(result).toContain('## [2026.07.0] - 2026-07-14');

		// The fresh Unreleased comes first and is empty; the stamped section carries
		// the entries that were under Unreleased.
		const unreleasedIdx = result.indexOf('## [Unreleased]');
		const stampedIdx = result.indexOf('## [2026.07.0] - 2026-07-14');
		expect(unreleasedIdx).toBeLessThan(stampedIdx);

		const between = result.slice(unreleasedIdx + '## [Unreleased]'.length, stampedIdx);
		expect(between.trim()).toBe('');
	});

	it('moves the Unreleased entries under the stamped version', () => {
		const result = stampChangelog(changelog, '2026.07.0', '2026-07-14');
		const stampedIdx = result.indexOf('## [2026.07.0] - 2026-07-14');
		const nextIdx = result.indexOf('## [2026.06.0]');
		const section = result.slice(stampedIdx, nextIdx);

		expect(section).toContain('- Dark mode toggle in Settings.');
		expect(section).toContain('- Admin delete-user no longer preselects the wrong user.');
	});

	it('leaves already-released sections intact', () => {
		const result = stampChangelog(changelog, '2026.07.0', '2026-07-14');
		expect(result).toContain('## [2026.06.0] - 2026-06-01');
		expect(result).toContain('- Initial account archiving.');
	});

	it('stamps a first release when Unreleased is the only section', () => {
		const firstChangelog = `# Changelog

## [Unreleased]

### Added

- Everything, for the first time.
`;
		const result = stampChangelog(firstChangelog, '2026.07.0', '2026-07-14');
		expect(result).toContain('## [Unreleased]');
		expect(result).toContain('## [2026.07.0] - 2026-07-14');
		expect(result).toContain('- Everything, for the first time.');
		expect(result.endsWith('\n')).toBe(true);
	});

	it('refuses to stamp when there is nothing to release', () => {
		const empty = `# Changelog

## [Unreleased]

## [2026.06.0] - 2026-06-01

### Added

- Something old.
`;
		expect(() => stampChangelog(empty, '2026.07.0', '2026-07-14')).toThrow(/nothing to release/i);
	});

	it('throws when there is no Unreleased section', () => {
		const noUnreleased = `# Changelog

## [2026.06.0] - 2026-06-01

- Something.
`;
		expect(() => stampChangelog(noUnreleased, '2026.07.0', '2026-07-14')).toThrow(/unreleased/i);
	});
});

describe('computeRelease', () => {
	it('returns the next version and the rewritten changelog together', () => {
		const changelog = `# Changelog

## [Unreleased]

### Added

- A user-visible thing.
`;
		const result = computeRelease({
			changelog,
			tags: ['2026.07.0'],
			today: '2026-07-14'
		});

		expect(result.version).toBe('2026.07.1');
		expect(result.changelog).toContain('## [2026.07.1] - 2026-07-14');
		expect(result.changelog).toContain('- A user-visible thing.');
		expect(result.changelog.indexOf('## [Unreleased]')).toBeLessThan(
			result.changelog.indexOf('## [2026.07.1]')
		);
	});
});
