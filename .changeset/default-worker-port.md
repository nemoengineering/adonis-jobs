---
'@nemoventures/adonis-jobs': major
---

**Breaking:** The worker HTTP server now defaults to port `9009` (via `QUEUE_PORT` env variable) instead of falling back to `PORT` or `3333`. The HTTP server is also no longer started when health checks and metrics are both disabled.
