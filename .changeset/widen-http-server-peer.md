---
'@nemoventures/adonis-jobs': patch
---

Allow `@adonisjs/http-server@^9.0.0` as a peer dependency. `@adonisjs/core@7.3.3` bumped its `@adonisjs/http-server` dependency to `^9.0.0`, which previously made `node ace add @nemoventures/adonis-jobs` fail on fresh AdonisJS v7 projects due to peer-dep resolution. Existing `^8.0.0` installs continue to work.
