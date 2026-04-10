---
name: webhook-listener
description: Public API, configuration, and boundaries of the @contentstack/webhook-listener package
---

# Webhook listener package – Contentstack Webhook Listener

## When to use

- Integrating or extending the HTTP webhook server
- Changing defaults, messages, logging, or webhook routing behavior
- Documenting behavior for DataSync consumers

## Instructions

### Entry points

- **`src/index.ts`** (compiled to `dist/`): primary module consumers import from `@contentstack/webhook-listener`.
- **Public exports** include: `register`, `start`, `shutdown`, `getEventEmitter`, `setConfig`, `getConfig`, `setLogger` (re-exported from logger). Consumers must call **`register(callback)`** before **`start(config, customLogger?)`** or `start` rejects.

### Core behavior

- **`src/core.ts`**: creates the HTTP listener (body parsing, basic auth if configured, webhook payload handling).
- **`src/defaults.ts`**: default `listener.port`, `listener.endpoint`, allowed webhook **actions**, and **reconnection** defaults.
- **`src/logger.ts`**: pluggable logger; optional **`customLogger`** passed to `start` must expose `info`, `debug`, `error`, `warn` (see `start` implementation).

### Configuration

- User config is merged with defaults (Lodash `merge`). Important keys under `listener`: `port`, `endpoint`, `basic_auth`, `actions`, `reconnection`—see **`src/defaults.ts`** and root **README** table for the subset documented for users.
- **`PORT`** env var overrides `listener.port` when starting the server.

### Boundaries

- This package **notifies** a registered function when a valid webhook is received; it does **not** persist content or run DataSync Manager—that lives in other DataSync modules.
- Broader product context: [Contentstack DataSync](https://www.contentstack.com/docs/guide/synchronization/contentstack-datasync).

### Types

- **`typings/`** and `"types": "./typings"` in `package.json`—keep public types consistent with `src/` exports.
