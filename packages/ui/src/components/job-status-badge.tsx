import type { JobStatus } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from './ui/badge'
import { getJobStatusConfig } from '@/lib/job-status-config'

export function JobStatusBadge({ status }: { status: JobStatus | string }) {
  const config = getJobStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      <Icon />
      {status}
    </Badge>
  )
}
