<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Development workflow

- Work on a focused branch and open a pull request into `main`.
- Keep changes scoped; do not mix generated files or unrelated cleanup into feature commits.
- Never commit `.env` files, credentials, OAuth secrets, database URLs, or private keys.
- Add or update tests when behavior changes. Until a broader test suite exists, release-rule tests are the minimum automated tests.
- Run `npm run ci` before requesting review or merging.
- Document database schema changes and commit generated Drizzle migrations once migrations are introduced.
- Production releases use tags in the form `PRD/vMAJOR.MINOR.PATCH`, and the tagged commit must be contained in `main`.
