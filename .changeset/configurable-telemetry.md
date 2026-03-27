---
'@nemoventures/adonis-jobs': minor
---

Add a `telemetry` option to the queue configuration to allow users to provide a custom BullMQ `Telemetry` implementation, or disable the built-in one entirely. This is useful when using an external instrumentation library that patches BullMQ prototypes, avoiding double spans.
