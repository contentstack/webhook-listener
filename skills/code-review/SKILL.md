---
name: code-review
description: PR checklist and review expectations for this repository
---

# Code review – Contentstack Webhook Listener

## When to use

- Opening a PR or reviewing someone else’s changes

## Instructions

### Before requesting review

- **`npm test`** passes (includes compile + Jest coverage).
- **User-visible behavior** changes are reflected in **README** or typings if needed.
- **Release-affecting** changes: **`package.json` version** bumped appropriately; GitHub **version-bump** workflow expectations are met (see [dev-workflow](../dev-workflow/SKILL.md)).

### Review focus

- **Correctness**: webhook handling, auth, error paths, and shutdown/reconnect behavior in `src/`.
- **Compatibility**: public exports and config shape for `@contentstack/webhook-listener` consumers.
- **Tests**: new behavior covered under `test/unit/` when it reduces regression risk.
- **Security**: no secrets in code; dependencies align with org policy (SCA/policy workflows).

### Severity (optional labels)

- **Blocker**: breaks consumers, security issue, or CI consistently red.
- **Major**: wrong behavior or missing tests for important paths.
- **Minor**: style, docs nits, non-critical refactors.
