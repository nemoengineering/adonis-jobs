# AGENTS.md

Job-queue package for AdonisJS 6, built on BullMQ. pnpm workspace with one published package and a runnable playground app.

## Workspace layout

- `packages/core` (`@nemoventures/adonis-jobs`) — the actual library. Source is plain TS; ships from `build/` produced by **tsdown** (bundler) + `tsc --emitDeclarationOnly` for types. Subpath imports use `#job/*` (mapped to `src/job/*.js`).
- Dashboard: the only first-party dashboard is the **QueueDash** integration shipped inside core at `packages/core/src/ui/queuedash/`, exposed as the `@nemoventures/adonis-jobs/ui/queuedash` subpath export (`queueDashUiRoutes()`). The previous in-house `@nemoventures/adonis-jobs-ui` / `…-ui-api` packages were removed; do not reintroduce them.
- `playground/` — a real AdonisJS app used for manual testing. Not published (ignored by changesets). Has its own `compose.yml` with `redis`/`dragonfly` profiles, Jaeger, Prometheus, Grafana.
- `docs/` — Vocs site. Also ignored by changesets.
- Workspace globs include `examples/*` (none currently checked in).
- Catalog: `@adonisjs/core` is pinned via `pnpm-workspace.yaml` `catalog:`; reference it as `"catalog:"` in package.json.

## Commands

Root scripts run across all workspace packages via `pnpm -r`:

- `pnpm lint` / `pnpm lint:fix` — **oxlint** (not ESLint). Config: `oxlint.config.ts`.
- `pnpm format` — **oxfmt** (not Prettier). Config: `oxfmt.config.ts`. `.prettierignore` exists but is unused.
- `pnpm typecheck` — `tsc --noEmit` in every package.
- `pnpm test` — runs each package's `test` script. Only `packages/core` has tests today (Japa).
- `pnpm build` — builds all packages.
- `pnpm release` — `pnpm build && changeset publish` (used by CI; do not run manually).

### Single-package / single-test workflows

- Filter with pnpm: `pnpm --filter @nemoventures/adonis-jobs <script>`.
- Run a single core test file: `pnpm --filter @nemoventures/adonis-jobs quick:test --files "tests/unit/job_scheduler.spec.ts"` (Japa CLI args pass through). `quick:test` skips c8 coverage; `test` wraps it in c8.
- Tests live at `packages/core/tests/**/*.spec.ts`. Runner entrypoint: `packages/core/bin/test.ts`. Plugins: assert, expect, expect-type, snapshot, file-system (basePath `packages/core/tmp`).
- Current tests are unit-only and do not require a running Redis (connection resolver uses a fake). The compose stack is for the playground, not the test suite.

### Core build is non-trivial

`packages/core` `build` runs: `tsdown` (bundle to `build/`) → `tsc --emitDeclarationOnly` (d.ts) → `copy:templates` (stubs) → `index:commands` (runs `adonis-kit index build/commands` to generate the command manifest).

CI's `.github/actions/setup` runs `pnpm --filter @nemoventures/adonis-jobs build` before lint/typecheck/tests. If `ui-api` / playground typecheck fails locally with module-resolution errors against `@nemoventures/adonis-jobs/*` subpath exports, build core first.

## Node, package manager, registry

- Node **>=24** required by `packages/core` (`engines.node`). CI matrix tests on 22.x and 24.x; lint/typecheck/release pin to 24.
- pnpm 10.32.1 via Corepack (`packageManager` field). Do not switch to npm/yarn.
- `.npmrc` configures the private `@taskforcesh` registry for `@taskforcesh/bullmq-pro`. `pnpm install` requires `BULLMQ_PRO_TOKEN` in the environment (CI secret). Without it install will fail. `bullmq-pro` is an optional peer dep — code paths must not assume it.
- `pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` (7 days). Lockfile installs are unaffected, but `pnpm add` / `pnpm update` will refuse versions published in the last 7 days. Override per-invocation with `--ignore-minimum-release-age`. `@taskforcesh/bullmq-pro` is exempted via `minimumReleaseAgeExclude` (private commercial registry).

## Conventions worth knowing

- ESM only (`"type": "module"`). All relative TS imports use the `.ts` extension at source (see `bin/test.ts`, `configure.ts`). Subpath imports in core use `#job/*` style with `.js` suffix.
- Source style and lint rules come from `@julr/tooling-configs` (oxc preset, adonisjs flavor). Use `pnpm lint:fix` and `pnpm format` rather than editing config.
- Stubs live in `packages/core/stubs/` and are copied as-is into `build/` during the build (`*.stub` files). Add new stubs there, not under `build/`.
- New ace commands go under `packages/core/commands/<group>/<command>.ts`. They are auto-indexed by `adonis-kit index` at build time — do not hand-edit `build/commands/main.js`.
- Configure hook for end users: `packages/core/configure.ts` (run via `node ace configure @nemoventures/adonis-jobs`).

## Releases

- Changesets-based. Add a changeset with `pnpm changeset` for any user-facing change in `packages/*` (playground and docs are ignored — see `.changeset/config.json`).
- Releases are automated by `.github/workflows/release.yml` on pushes to `main`. Do not run `pnpm release` locally.
- Base branch is `main`.
