---
'@nemoventures/adonis-jobs': patch
---

Discontinue the in-house dashboard packages `@nemoventures/adonis-jobs-ui` and `@nemoventures/adonis-jobs-ui-api`. They never reached a stable state and have been removed from this repository.

If you were using `uiRoutes()` / `renderJobsUi()` to mount the in-house dashboard, switch to the bundled QueueDash integration:

```ts
import { queueDashUiRoutes } from '@nemoventures/adonis-jobs/ui/queuedash'

queueDashUiRoutes().prefix('/admin/queue')
```

See the [Queue Dashboard guide](https://adonis-jobs.nemo.engineering/guides/queue-dashboard) for details.
