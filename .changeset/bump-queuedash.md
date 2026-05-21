---
'@nemoventures/adonis-jobs': patch
---

Bump the bundled QueueDash integration from `3.17.0` to `3.19.0`. Highlights from the upstream releases:

- **3.19.0**: Tailwind v4 upgrade and a new add-job JSON editor experience.
- **3.18.0**: `prefix` support for queue configurations.

Also bumps `@trpc/server` from `^11.13.4` to `^11.17.0` to satisfy QueueDash's new peer-dependency floor and clear the pre-existing peer-dep mismatch warning during install.
