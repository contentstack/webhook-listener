---
name: testing
description: Jest tests, layout, coverage, and how they relate to the TypeScript build
---

# Testing – Contentstack Webhook Listener

## When to use

- Adding or changing unit/integration tests
- Debugging `npm test` or coverage output

## Instructions

### Runner and config

- **Jest** is configured in **`jest.config.js`**: Node environment, `testRegex: "./test/.*.js$"`, coverage under **`coverage/`** (json + html reporters).
- **`npm test`** runs **`pretest`** → `npm run compile` (runs `tsc`), then **`jest --coverage`**. Ensure **`dist/`** is up to date when tests import compiled code.

### Layout

- Tests live under **`test/unit/`** (e.g. `*.test.js`). **`test/unit/dummy/`** is ignored by Jest (`testPathIgnorePatterns`).

### Style and scope

- Tests are **JavaScript** (`.js`) against the compiled module graph; follow existing files (`index.test.js`, `core.test.js`, `logger.test.js`) for patterns.
- Use **supertest** (devDependency) for HTTP-level assertions where applicable.

### Credentials and secrets

- Do not commit real webhook secrets or Basic Auth credentials; use test doubles or env only as needed in CI-safe ways.
