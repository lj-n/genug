# ADR-0012: CalVer releases, a hand-curated changelog, and a stage deploy lane

Date: 2026-07-14
Status: accepted

## Context

genug-da is a self-hosted app. Until now there was no way to tell which build
was live: `package.json` was stuck at `0.0.1`, there were zero git tags,
deployment was a manual pull of an untagged image straight from `main`, and
there was no changelog. When something broke the exact shipped code could not be
pinned down, and a candidate build could not be tried without risking live data
(issue #99). This is a hard pre-flip gate for going public (#116): the repo
should ship with a complete self-host + release story.

Several axes were open. **How to version:** SemVer forces a major/minor/patch
judgement on every change, which is ceremony a small self-hosted project does
not need. **How to record changes:** auto-generated changelogs (release-please,
changesets, conventional commits) turn the changelog into a second commit log
full of refactors and dependency bumps. **How to stage:** a literal `stage` git
branch means a branch-promotion flow and divergence to manage.

## Decision

**CalVer `YYYY.0M.MICRO`.** Four-digit year, zero-padded two-digit month, and a
per-month micro counter that resets to `0` each month (`2026.07.0`, `2026.07.1`,
then `2026.08.0`). The date decides the version, so there is no major/minor/patch
call to make; zero-padding keeps git tags sorting correctly as strings. The tag
is the bare version, no `v` prefix. The first release with no existing tags is
`YYYY.0M.0` — bootstrapping needs no special case.

**A hand-curated `CHANGELOG.md`** in Keep-a-Changelog shape: a top
`## [Unreleased]` section with `### Added` / `### Changed` / `### Fixed`
subsections. Only user-visible changes are recorded — refactors, tests, CI,
docs, and dependency bumps get no entry. Entries land as part of the change that
introduces them, enforced as a project convention (CLAUDE.md), not by tooling.

**One pure seam.** The fiddly version math and changelog stamping live behind a
pure module, `src/lib/version/` — given the existing tags, today's date, and the
current changelog text, it returns the next version and the rewritten changelog.
No git, no filesystem, no clock inside; the date and tags are inputs. This is the
only new unit-tested surface (`calver.test.ts`). `scripts/release.ts`
(`npm run release`) is the mechanical adapter: it reads git tags, `CHANGELOG.md`,
and `package.json`, delegates to the module, then writes the files and creates
the release commit and tag. This mirrors ADR-0002 (a mechanical adapter around a
deep module) and ADR-0004 (isolating fiddly math behind one internal seam).

**A stage lane via image tags, not a branch (Model A).** One long-lived branch
(`main`); "stage" and "prod" are image tags, not branches. A push to `main`
publishes a rolling `:stage` plus an immutable `:sha-<short>` to
`ghcr.io/lj-n/genug-da`; a version tag publishes the frozen `:<version>` plus a
moving `:latest`. A deploy host runs two Compose stacks pulling `:stage` and
`:latest`; rollback is pinning prod to a prior `:<version>`. A new `publish.yml`
handles this, separate from `ci.yml` so the PR gate is untouched; it
authenticates with the built-in `GITHUB_TOKEN` (`packages: write`), reuses the
`dorny/paths-filter` gating to skip docs-only pushes, and does not re-run the
test suite (`main` is already green via the PR gate). Images stay on `ghcr.io`
even while the repo is private; the host authenticates once via a PAT with
`read:packages`.

**Version surfacing.** The app exposes its version through SvelteKit's
`kit.version.name`, fed from `package.json` plus, for stage builds, the short
build SHA. The `Dockerfile` takes a `BUILD_SHA` build arg that `publish.yml`
sets only for `main` builds, so stage shows a dev-flavoured `2026.07.0-dev+a1b2c3d`
and prod (tag) builds show the clean CalVer `2026.07.0`. The UI renders this
string small and muted beside the `Logo` in both navigations — the fastest
post-pull sanity check that a new image actually landed. Local dev falls back to
the plain `package.json` version. Nothing in app logic branches on environment;
the stage/prod split is entirely a deploy-time concern.

The issue named this "ADR 0010", but 0010 and 0011 were taken by the time this
landed; it is recorded here as 0012.

## Consequences

- Cutting a release is one command with no hand-calculated micro and no manual
  git steps; `npm run release` refuses to run on a dirty tree or when
  `[Unreleased]` is empty (an empty release is a mistake, not a no-op).
- The changelog stays a readable product log, not a second commit log — at the
  cost of discipline: a user-visible change that forgets its `[Unreleased]`
  entry ships unrecorded, since nothing enforces it mechanically.
- A running instance advertises its exact build beside the logo, so a bad stage
  build is caught before it is promoted, and prod rollback is a tag pin.
- The publish workflow, `Dockerfile`, image-tag scheme, image pull, and the
  trivial version-label rendering are proven by a real stage deploy rather than
  automated tests — only the pure release module is unit-tested.
- `npm run release` runs the `.ts` script via Node's type stripping
  (`--experimental-strip-types`), so it shares the exact module the tests cover
  without a build step; this depends on Node 22+.
