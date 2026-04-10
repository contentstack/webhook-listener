---
name: typescript-style
description: TypeScript and Node coding conventions for this repo—tsconfig, modules, typings
---

# TypeScript style – Contentstack Webhook Listener

## When to use

- Editing or adding `.ts` under `src/` or `example/`
- Adjusting compiler options or public type surface (`typings/`)

## Instructions

### Compiler (`tsconfig.json`)

- **`include`**: `src/**/*` only—library code lives under **`src/`**. **`example/`** is not in that include; demos use checked-in **`example/index.js`** with `npm start` (`node example/`). If you change **`example/index.ts`**, update the corresponding JS (or add a dedicated compile step—there is none in `package.json` today).
- **Output**: CommonJS (`"module": "commonjs"`), **`outDir`: `dist`**, **`baseUrl`: `./src`**, **`sourceMap`: true**.
- **`paths`**: resolves `*` via `node_modules/*` and `src/types/*`—follow that layout for new type-only modules.

### Source style

- Files use **`'use strict';`** and the existing import style (`import` / `export`); match surrounding modules when adding code.
- Prefer explicit, conservative typing for **public** APIs; internal code may use `any` where the codebase already does—avoid widening surface area without need.

### Types shipped to consumers

- Package types are exposed via **`typings/`** (`package.json` `"types": "./typings"`). When you change exported symbols in **`src/`**, update typings (or generated hand-maintained defs) so they stay aligned.

### Build commands

- Compile and clean steps are in **[dev-workflow](../dev-workflow/SKILL.md)**—this skill does not repeat them.
