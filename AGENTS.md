# Contentstack Webhook Listener – Agent guide

**Universal entry point** for contributors and AI agents. Detailed conventions live in **`skills/*/SKILL.md`**.

## What this repo is

| Field | Detail |
| --- | --- |
| **Name:** | [contentstack/webhook-listener](https://github.com/contentstack/webhook-listener) — npm `@contentstack/webhook-listener` |
| **Purpose:** | TypeScript/Node HTTP server library that receives Contentstack webhooks and invokes a registered callback; part of Contentstack DataSync. |
| **Out of scope (if any):** | Does not implement DataSync Manager, content/asset stores, or CMS configuration—only the webhook HTTP listener surface. |

## Tech stack (at a glance)

| Area | Details |
| --- | --- |
| Language | TypeScript (see `tsconfig.json`); Node.js **20+** (see README). |
| Build | `tsc` → output in `dist/`; `package.json` `main` is `./dist`. |
| Tests | Jest, `test/unit/*.test.js`; `npm test` runs with coverage (`jest.config.js`). |
| Lint / coverage | No ESLint/Prettier in repo; coverage via Jest (`coverage/`). |
| Other | Types under `typings/`; runnable example under `example/`. |

## Commands (quick reference)

| Command type | Command |
| --- | --- |
| Build | `npm run build-ts` (clean + `tsc`) or `npm run compile` (`tsc` only) |
| Test | `npm test` (runs `pretest` → compile, then Jest with coverage) |
| Lint | Not configured |

CI / automation: [.github/workflows/check-version-bump.yml](.github/workflows/check-version-bump.yml), [sca-scan.yml](.github/workflows/sca-scan.yml), [policy-scan.yml](.github/workflows/policy-scan.yml), [codeql-analysis.yml](.github/workflows/codeql-analysis.yml), [github-release.yml](.github/workflows/github-release.yml), [issues-jira.yml](.github/workflows/issues-jira.yml).

## Where the documentation lives: skills

| Skill | Path | What it covers |
| --- | --- | --- |
| Dev workflow & CI | `skills/dev-workflow/SKILL.md` | Branches, npm scripts, Husky, GitHub Actions, version bumps |
| TypeScript style | `skills/typescript-style/SKILL.md` | `tsconfig`, `src/` vs `example/`, typings, module conventions |
| Package API | `skills/webhook-listener/SKILL.md` | Public exports, config, integration with DataSync |
| Testing | `skills/testing/SKILL.md` | Jest layout, compiled output, coverage |
| Code review | `skills/code-review/SKILL.md` | PR expectations and checklist |

An index with “when to use” hints is in `skills/README.md`.

## Using Cursor (optional)

If you use **Cursor**, `.cursor/rules/README.md` only points to **`AGENTS.md`**—same docs as everyone else.
