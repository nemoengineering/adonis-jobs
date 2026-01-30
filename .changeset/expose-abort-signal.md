---
'@nemoventures/adonis-jobs': minor
---

Expose BullMQ's `AbortSignal` to jobs via `this.signal`. The signal is aborted when the worker shuts down gracefully or when a job is explicitly cancelled.
