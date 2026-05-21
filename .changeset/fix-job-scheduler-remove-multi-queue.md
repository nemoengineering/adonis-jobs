---
'@nemoventures/adonis-jobs': patch
---

Fix `JobScheduler.remove()` reporting success without actually deleting the scheduler. The wrapper previously ignored the boolean returned by BullMQ's `Queue#removeJobScheduler()` and short-circuited after the first non-throwing queue, so schedulers registered on any queue other than the first one in `config.queue.queues` were left active while the caller saw `true`. `remove()` now honours the BullMQ return value, keeps scanning remaining queues when none reported a deletion, and only returns `true` once a queue actually removed the scheduler (closes #115).
