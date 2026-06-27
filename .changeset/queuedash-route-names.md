---
'@nemoventures/adonis-jobs': patch
---

Name the routes registered inside `queueDashUiRoutes()` so the returned group can be named or prefixed-and-named by consumers (e.g. `queueDashUiRoutes().prefix('/jobs').as('jobs')`). Previously this threw `RuntimeException: Routes inside a group must have names before calling "router.group.as"`.

The routes are self-namespaced under `queuedash.*` (e.g. `queuedash.index`, `queuedash.trpc`) to avoid collisions with application routes. If you additionally name the group, the names stack via prepend — `queueDashUiRoutes().as('jobs')` produces `jobs.queuedash.index`, etc.
