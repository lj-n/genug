# Developer Documentation

Conventions and decisions for contributors and agents working on the codebase.
For user- and integrator-facing docs, see the [docs index](../README.md).

## Path-specific conventions

Mirrors the "Path-Specific Documentation" section of `CLAUDE.md` — keep the two
in sync.

- [code-style.md](code-style.md) — code-level style rules (runes, TypeScript, naming, errors/comments)
- [routes.md](routes.md) — `src/routes/**`
- [remote-functions.md](remote-functions.md) — `src/lib/remote-functions/**`
- [database.md](database.md) — `src/lib/server/db/**` and server helpers
- [components.md](components.md) — `src/lib/components/**`
- [schemas.md](schemas.md) — `src/lib/schemas/**`
- [tests.md](tests.md) — unit and Playwright tests

## Workflow and quality

- [screenshots.md](screenshots.md) — how the README screenshots are captured
- [a11y-keyboard-checklist.md](a11y-keyboard-checklist.md) — manual keyboard-accessibility pass for core flows

## Decisions and agent rules

- [adr/](adr/) — architecture decision records
- [agents/](agents/) — agent workflow rules (domain docs, issue tracker, triage labels)
