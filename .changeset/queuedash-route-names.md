---
'@nemoventures/adonis-jobs': patch
---

Name the routes registered inside `queueDashUiRoutes()` so the returned group can be named or prefixed-and-named by consumers (e.g. `queueDashUiRoutes().prefix('/jobs').as('jobs')`). Previously this threw `RuntimeException: Routes inside a group must have names before calling "router.group.as"`.
