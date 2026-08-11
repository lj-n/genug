# Contributing to genug

Thanks for your interest in genug. The project is source-available and
maintained by a single person, so contributions work a little differently
than in larger projects.

## Issues: welcome

Bug reports and feature requests are welcome — please use the
[issue templates](https://github.com/lj-n/genug/issues/new/choose).
For suspected security vulnerabilities, do **not** open a public issue; see
[SECURITY.md](SECURITY.md).

## Pull requests: open an issue first

Please don't send unsolicited pull requests. Open an issue describing the bug
or change first and wait for a maintainer response. This keeps review effort
bounded and avoids work on changes that won't be merged. PRs without a
prior, agreed-upon issue may be closed without review.

## Development setup

See the [Development section of the README](../README.md#development) for
setup and the test/lint commands. In short: Node.js 22+ and npm 11.17+
(`npm install -g npm@11` — package installs enforce a 3-day release-age
cooldown against supply-chain attacks, which older npm versions would
silently ignore), `npm install`, then
`npm run dev`, `npm run check`, `npm run lint`, `npm run test:unit`,
`npm run test:e2e`. A committed `.env` provides the `DATABASE_URL` default, so
no prefix is needed.

## Conduct

Be respectful. This project has no formal code of conduct or enforcement
process; disrespectful behaviour in issues or PRs simply gets moderated at
the maintainer's discretion.
