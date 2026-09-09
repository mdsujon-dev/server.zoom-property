# Deploy issue: `npm run build` fails with ~300 TypeScript errors

**Status:** root cause identified — the failure is environmental, not a code defect.
**Symptom:** `tsc` reports `TS2307` for nearly every third-party import, plus cascading
`TS7006` / `TS2339` / `TS2550` errors across ~40 files.

## It is one failure, not many

The error list looks catastrophic, but every entry traces back to a single fact:
**`node_modules` was not present when `tsc` ran.** The errors are tiers of one collapse.

| Tier | Example | Caused by |
|---|---|---|
| 1. Missing modules | `TS2307: Cannot find module 'express'` / `'mongoose'` / `'zod'` / `'sharp'` | packages absent |
| 2. Missing Node globals | `TS2591: Cannot find name 'Buffer'` / `'path'` | `@types/node` absent |
| 3. Lost contextual types | `TS7006: Parameter 'req' implicitly has an 'any' type` | no `RequestHandler` type to infer from |
| 4. Lost model methods | `TS2339: Property 'save' / '_id' / 'toObject' does not exist on type 'IStudent'` | `IStudent extends Document` unresolvable without mongoose types |
| 5. Missing ES lib | `TS2550: 'Promise.allSettled' does not exist` | see "Latent config bug" below |

Tiers 2–5 disappear automatically once tier 1 is fixed. **Do not "fix" them in source** —
annotating `req: any` or rewriting `Promise.allSettled` would bury the real problem.

## Why "just devDependencies were stripped" is not the explanation

An `npm ci --omit=dev` in the build environment was the first suspicion, since that
removes `@types/express` and `@types/bcrypt`. But it does not fit the evidence:

`mongoose`, `zod`, `sharp`, and `http-status-codes` are all **runtime `dependencies`**
and all **ship their own type declarations**. They resolve fine in a prod-only install.
They are reported as `TS2307` anyway — so the install did not merely lose devDependencies,
it did not happen at all (or ran against a different working directory).

Note the corollary: `typescript` is itself a devDependency. If `tsc` ran at all in an
environment with no `node_modules`, it was **a globally installed or otherwise
out-of-tree `tsc`**, not the project's pinned `5.7.x`. That is worth confirming.

## Verified locally

On the dev machine, at `server.TrainingInstituteManagement/`:

- `npx tsc --noEmit` → **0 errors**.
- `express`, `bcrypt`, `zod`, `http-status-codes`, `mongoose`, `sharp`, `multer`,
  `@types/node`, `@types/express`, `@types/bcrypt`, `@types/multer` → all present.

The committed source compiles clean. The break is in the build environment.

## Latent config bug (real, and now fixed)

`tsconfig.json` had `"target": "es2016"` with no explicit `lib`. The code uses:

- `Object.values` — ES2017 (`notification.model.ts`)
- `String.prototype.padStart` — ES2017 (`student.service.ts`, `fee.service.ts`)
- `Promise.allSettled` — ES2020 (`media-library.service.ts`)

None of these are in the ES2016 lib. It compiled locally **only by accident**: dependency
`.d.ts` files (`@types/node`, mongoose, express) carry `/// <reference lib="es2020" />`
directives that pull the newer libs into the program as a side effect. Remove the
dependencies and the real target shows through — which is exactly the `TS2550` tier above.

Fixed by setting `"target": "es2020"` (Node 20 supports it fully). ES2020 rather than
ES2022 deliberately: ES2022+ flips `useDefineForClassFields` to `true`, which changes
class-field initialization semantics. Not a risk worth taking as part of a build fix.

## Fixes applied

1. **`tsconfig.json`** — `target` raised `es2016` → `es2020`. Verified: `npx tsc --noEmit` clean.
2. **`Dockerfile`** — deps stage now `npm ci --include=dev`, so an ambient
   `NODE_ENV=production` (which `.env.production` sets) cannot strip the `@types/*` and
   `typescript` the build stage needs. The runtime stage still installs prod-only via
   `npm ci --omit=dev`, so the shipped image is unchanged in size.

## Still open — needs confirmation from whoever ran the build

The two fixes above harden the build, but neither explains a *completely* absent
`node_modules`. To close this out, confirm:

- [ ] **Where did this output come from?** Docker build log, Dokploy/CI log, or a manual
      `npm run build` over SSH on the server?
- [ ] **Is the platform actually using our `Dockerfile`?** Dokploy can fall back to
      Nixpacks/buildpacks. Nixpacks runs `npm ci` → `npm run build` → `npm prune --production`;
      if that order is disturbed, or if it detects the wrong directory in this
      monorepo layout, the build runs with no dependencies present.
- [ ] **Is the build context the repo root instead of `server.TrainingInstituteManagement/`?**
      The Dockerfile's `COPY package*.json ./` assumes the context *is* the server directory.
- [ ] **Did `npm ci` exit non-zero but get ignored?** `sharp` and `bcrypt` are native
      modules and are the usual suspects for install failures on Alpine.

## Reproducing the failure deliberately

To confirm the diagnosis, from a clean checkout:

```bash
cd server.TrainingInstituteManagement
rm -rf node_modules
tsc            # a global tsc, not npx — reproduces the reported error list
```

And the fix:

```bash
npm ci --include=dev && npm run build
```
