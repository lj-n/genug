/**
 * Cuts a CalVer release (ADR-0012). Thin mechanical adapter around the pure
 * `src/lib/version` module: it reads git tags, `CHANGELOG.md`, and
 * `package.json`, delegates every version/changelog decision to the module,
 * then writes the files and creates the release commit + tag. It performs no
 * version math or changelog parsing of its own.
 *
 * Run with `npm run release` (Node's type stripping executes the .ts directly).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

import { computeRelease } from '../src/lib/version/calver.ts';

const CHANGELOG_PATH = 'CHANGELOG.md';
const PACKAGE_PATH = 'package.json';

function git(...args: string[]): string {
	return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function main(): void {
	if (git('status', '--porcelain')) {
		throw new Error('Working tree is not clean — commit or stash changes before releasing.');
	}

	const tags = git('tag', '--list').split('\n').filter(Boolean);
	const changelog = readFileSync(CHANGELOG_PATH, 'utf8');

	const release = computeRelease({ changelog, tags, today: today() });

	if (tags.includes(release.version)) {
		throw new Error(`Tag ${release.version} already exists.`);
	}

	const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8'));
	pkg.version = release.version;

	writeFileSync(CHANGELOG_PATH, release.changelog);
	writeFileSync(PACKAGE_PATH, `${JSON.stringify(pkg, null, '\t')}\n`);

	git('add', CHANGELOG_PATH, PACKAGE_PATH);
	git('commit', '-m', `chore(release): ${release.version}`);
	git('tag', '-a', release.version, '-m', release.version);

	console.log(`Released ${release.version}.`);
	console.log(`Push it with: git push --follow-tags`);
}

function today(): string {
	// Adapter-side clock: the pure module takes the date as an input.
	return new Date().toISOString().slice(0, 10);
}

main();
