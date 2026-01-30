---
'@nemoventures/adonis-jobs': minor
---

Apply role-specific Redis connection defaults following BullMQ production recommendations. When `useSharedConnection` is `false`, Queue instances now set `enableOfflineQueue: false` (fail fast during disconnections) and Worker instances set `maxRetriesPerRequest: null` (required by BullMQ for resilient reconnection).
