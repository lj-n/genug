/**
 * Pure CalVer release math and Keep-a-Changelog stamping (ADR-0012).
 *
 * The version scheme is `YYYY.0M.MICRO`: four-digit year, zero-padded two-digit
 * month, and a per-month micro counter that resets to 0 each month. Everything
 * here is a pure function of its inputs — no git, no filesystem, no clock. The
 * `today` date and the existing tags are supplied by the caller (the release
 * script), so the fiddly parts stay unit-tested while the adapter stays thin.
 */

export type Release = {
	/** The `CHANGELOG.md` contents after stamping. */
	changelog: string;
	/** The computed next CalVer version. */
	version: string;
};

export type ReleaseInput = {
	/** Current `CHANGELOG.md` contents. */
	changelog: string;
	/** Existing git tags (any strings; non-CalVer entries are ignored). */
	tags: string[];
	/** Release date as an ISO `YYYY-MM-DD` string. */
	today: string;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Computes the next CalVer version from the existing tags and today's date. The
 * micro counter is scoped to the current `YYYY.0M`: only tags in this month
 * count, so the counter derives from the calendar and not from the highest tag
 * overall. First release of a month → `.0`.
 */
export function nextVersion(tags: string[], today: string): string {
	const prefix = monthPrefix(today);
	const micro = new RegExp(`^${prefix.replace(/\./g, '\\.')}\\.(\\d+)$`);

	const highest = tags.reduce((max, tag) => {
		const match = micro.exec(tag);
		return match ? Math.max(max, Number(match[1])) : max;
	}, -1);

	return `${prefix}.${highest + 1}`;
}

/** Splits an ISO `YYYY-MM-DD` string into its `YYYY.0M` prefix, throwing if malformed. */
function monthPrefix(today: string): string {
	const match = ISO_DATE.exec(today);
	if (!match) {
		throw new Error(`Expected an ISO date (YYYY-MM-DD), got: ${today}`);
	}
	const [, year, month] = match;
	return `${year}.${month}`;
}

const UNRELEASED = /^## \[Unreleased\]\s*$/i;
const VERSION_HEADING = /^## \[/;
const LIST_ITEM = /^\s*[-*]\s+\S/;

/** Computes the next version and the rewritten changelog in one call. */
export function computeRelease({ changelog, tags, today }: ReleaseInput): Release {
	const version = nextVersion(tags, today);
	return { changelog: stampChangelog(changelog, version, today), version };
}

/**
 * Stamps the `[Unreleased]` section into a dated `[version] - YYYY-MM-DD`
 * section and opens a fresh empty `[Unreleased]` above it. Released sections are
 * left untouched. Throws when there is no `[Unreleased]` heading or when it
 * carries no entries — an empty release is a mistake, not a no-op.
 */
export function stampChangelog(changelog: string, version: string, today: string): string {
	const lines = changelog.split('\n');

	const start = lines.findIndex((line) => UNRELEASED.test(line));
	if (start === -1) {
		throw new Error('CHANGELOG.md has no "## [Unreleased]" section to stamp.');
	}

	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		if (VERSION_HEADING.test(lines[i])) {
			end = i;
			break;
		}
	}

	const body = lines.slice(start + 1, end);
	if (!body.some((line) => LIST_ITEM.test(line))) {
		throw new Error('CHANGELOG.md [Unreleased] is empty — nothing to release.');
	}

	const head = lines.slice(0, start + 1).join('\n');
	const stamped = `## [${version}] - ${today}\n\n${trimBlankEdges(body).join('\n')}`;
	const rest = lines.slice(end).join('\n');

	return (
		[head, stamped, rest]
			.filter((part) => part.trim() !== '')
			.join('\n\n')
			.replace(/\n{3,}/g, '\n\n')
			.replace(/\s+$/, '') + '\n'
	);
}

/** Drops leading and trailing blank lines while keeping interior structure. */
function trimBlankEdges(lines: string[]): string[] {
	let first = 0;
	let last = lines.length - 1;
	while (first <= last && lines[first].trim() === '') first++;
	while (last >= first && lines[last].trim() === '') last--;
	return lines.slice(first, last + 1);
}
