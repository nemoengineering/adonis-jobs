---
title: Queue Dashboard
description: Set up and use the QueueDash UI for monitoring and managing your job queues
---

The package includes integration with [QueueDash](https://www.queuedash.com/), a web-based dashboard for monitoring and managing your BullMQ queues in real-time

## Setup

Add the dashboard routes to your `start/routes.ts` file:

```typescript
import router from '@adonisjs/core/services/router'
import { queueDashUiRoutes } from '@nemoventures/adonis-jobs/ui/queuedash'

// Add queue dashboard routes
router.group(() => {
  queueDashUiRoutes().prefix('/queue')
}).prefix('/admin')
```

This will make the dashboard available at `/admin/queue`. Run your AdonisJS application and open `http://localhost:3333/admin/queue` to access the dashboard.

### Custom Authentication

Since these routes are standard AdonisJS routes, you can protect them using a authentication middleware. 

```typescript
import { middleware } from '#start/kernel'

router.group(() => {
  queueDashUiRoutes().prefix('/queue')
})
  .prefix('/admin')
  .use(middleware.auth({ guards: ['basicAuth'] }))
```

## Next Steps

Learn about [monitoring and metrics](/guides/monitoring) to set up comprehensive observability for your job queues.
