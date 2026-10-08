---
'@nemoventures/adonis-jobs': patch
---

Name the routes registered inside `workbenchUiRoutes()` so the returned group can be named or prefixed-and-named by consumers (e.g. `workbenchUiRoutes().prefix('/jobs').as('jobs')`). Previously this threw `RuntimeException: Routes inside a group must have names before calling "router.group.as"`.

The routes are self-namespaced under `workbench.*` (`workbench.index`, `workbench.catchAll`) to avoid collisions with application routes. If you additionally name the group, the names stack via prepend — `workbenchUiRoutes().as('jobs')` produces `jobs.workbench.index`, etc.
