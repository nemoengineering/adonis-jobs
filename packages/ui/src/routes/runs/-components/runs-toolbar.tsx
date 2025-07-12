import { JobStatus } from '@nemoventures/adonis-jobs-ui-api/types'

import { Switch } from '@/components/ui/switch'
import { MultiSelect } from '@/components/ui/multi-select'
import { createStatusOption } from '@/lib/job-status-config'

interface RunsToolbarProps {
  status: JobStatus[]
  onStatusChange: (values: string[]) => void
  onlyRootJobs: boolean
  onOnlyRootJobsChange: (checked: boolean) => void
}

export function RunsToolbar(props: RunsToolbarProps) {
  const statusOptions = [
    createStatusOption(JobStatus.Active),
    createStatusOption(JobStatus.Waiting),
    createStatusOption(JobStatus.Delayed),
    createStatusOption(JobStatus.Completed),
    createStatusOption(JobStatus.Failed),
    createStatusOption(JobStatus.Paused),
  ]

  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <MultiSelect
        options={statusOptions}
        value={props.status}
        onValueChange={props.onStatusChange}
        placeholder="Filter by status..."
        className="w-[220px]"
        maxDisplayItems={2}
      />
      <div className="flex items-center space-x-2">
        <Switch checked={props.onlyRootJobs} onCheckedChange={props.onOnlyRootJobsChange} />
        <label className="text-sm font-medium leading-none">Root jobs only</label>
      </div>
    </div>
  )
}
