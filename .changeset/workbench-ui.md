---
'@nemoventures/adonis-jobs': minor
---

Add optional Workbench UI integration as an alternative to QueueDash. Mount it via the new `@nemoventures/adonis-jobs/ui/workbench` subpath export:

```ts
import { workbenchUiRoutes } from '@nemoventures/adonis-jobs/ui/workbench'

workbenchUiRoutes().prefix('/admin/workbench')
```

`@getworkbench/core` is declared as an optional peer dependency, so it only needs to be installed by users who opt into the Workbench UI. See the [Workbench Dashboard guide](https://adonis-jobs.nemoventures.dev/guides/workbench-dashboard) for full documentation.
