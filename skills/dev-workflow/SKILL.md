---
name: dev-workflow
description: Branches, npm scripts, Husky, GitHub Actions, and version/release expectations for this repo
---

# Dev workflow – Contentstack Webhook Listener

## When to use

- Changing build/test commands or CI
- Cutting releases or bumping `package.json` version
- Working with Git hooks

## Instructions

### Scripts (`package.json`)

- **`npm run build-ts`**: `rimraf dist` then full TypeScript compile (artifact: `dist/`).
- **`npm run compile` / `npm run watch-ts`**: `tsc` with or without watch; no clean in `compile`.
- **`npm test`**: `pretest` runs `compile`; then `jest --coverage`.
- **`npm start`**: runs `node example/` for a local demo.

### Source layout

- Implement in **`src/`**; published entry is **`dist/`** (from `"main": "./dist"`).
- Do not edit **`dist/`** by hand—regenerate via compile.

### Git hooks (Husky)

- **`npm run pre-commit`**: installs Husky and ensures `.husky/pre-commit` is executable—see repo for current hook behavior.

### CI (`.github/workflows`)

- **Version bump** ([check-version-bump.yml](../../.github/workflows/check-version-bump.yml)): on PRs, may require `package.json` version to increase vs latest git tag when certain paths change—confirm patterns match this repo’s layout (`src/`, `test/`, etc.) when troubleshooting.
- **SCA / policy / CodeQL / release / Jira**: see workflow files for triggers and purposes.

### PR expectations

- Release-affecting changes typically need a **version bump** in `package.json` per org process; align with the version-bump workflow and [code-review](../code-review/SKILL.md).
