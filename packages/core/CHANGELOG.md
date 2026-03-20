# @nemoventures/adonis-jobs

## 2.0.0

### Major Changes

- 503eb18: Migrate to AdonisJS 7
- fb5cedc: **Breaking:** The worker HTTP server now defaults to port `9009` (via `QUEUE_PORT` env variable) instead of falling back to `PORT` or `3333`. The HTTP server is also no longer started when health checks and metrics are both disabled.

### Minor Changes

- fb5cedc: Expose BullMQ's `AbortSignal` to jobs via `this.signal`. The signal is aborted when the worker shuts down gracefully or when a job is explicitly cancelled.
- 2dd9100: Apply role-specific Redis connection defaults following BullMQ production recommendations. When `useSharedConnection` is `false`, Queue instances now set `enableOfflineQueue: false` (fail fast during disconnections) and Worker instances set `maxRetriesPerRequest: null` (required by BullMQ for resilient reconnection).

### Patch Changes

- fb5cedc: Fix comment formatting in `queue.stub` config file.
- fb5cedc: Add `--queue` as an alias for the `--queues` flag in `queue:work` command to match documentation.

## 1.1.0

### Minor Changes

- 663cdb7: This change introduces the "Metrics per worker" feature, allowing each worker HTTP Server to expose its own Prometheus metrics endpoint.
- 8981d62: Added custom UI Package. Docs are coming soon.

### Patch Changes

- 41d64d6: Make UIs work on subdomains
- 086339b: Update dependencies

## 1.1.0-beta.3

### Patch Changes

- 41d64d6: Make UIs work on subdomains

## 1.1.0-beta.1

### Minor Changes

- 663cdb7: This change introduces the "Metrics per worker" feature, allowing each worker HTTP Server to expose its own Prometheus metrics endpoint.

## 1.1.0-beta.0

### Minor Changes

- 8981d62: Added custom UI Package. Docs are coming soon.
