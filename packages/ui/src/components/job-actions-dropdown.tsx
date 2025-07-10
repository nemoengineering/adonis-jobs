import { RotateCcw, Play, Trash } from 'lucide-react'
import { JobStatus } from '@nemoventures/adonis-jobs-ui-api/types'

import { useRerunJob, useRetryJob, useRemoveJob } from '@/hooks/use-dashboard'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface JobActionsDropdownProps {
  jobId: string
  jobStatus?: JobStatus | string
  children?: React.ReactNode
}

export function JobActionsDropdown({ jobId, jobStatus, children }: JobActionsDropdownProps) {
  const rerunJobMutation = useRerunJob()
  const retryJobMutation = useRetryJob()
  const removeJobMutation = useRemoveJob()

  const canRetry = jobStatus === JobStatus.Failed

  function handleRerunJob(e: React.MouseEvent) {
    e.stopPropagation()
    rerunJobMutation.mutate({ jobId })
  }

  function handleRetryJob(e: React.MouseEvent) {
    e.stopPropagation()
    retryJobMutation.mutate({ jobId })
  }

  function handleRemoveJob(e: React.MouseEvent) {
    e.stopPropagation()
    removeJobMutation.mutate({ jobId })
  }

  return (
    <>
      {children}
      <DropdownMenuItem onClick={handleRerunJob}>
        <Play className="mr-2 h-4 w-4" />
        Rerun
      </DropdownMenuItem>
      {canRetry && (
        <DropdownMenuItem onClick={handleRetryJob}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleRemoveJob} className="text-red-400">
        <Trash className="mr-2 h-4 w-4" />
        Remove
      </DropdownMenuItem>
    </>
  )
}
