---
'@nemoventures/adonis-jobs': patch
---

Commit the app router when starting `queue:work`, so named-route lookups (`urlFor`, `signedUrlFor`, …) work inside jobs instead of throwing `Cannot lookup route`.
