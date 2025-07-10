import { Info } from 'lucide-react'
import type { JobRun } from '@nemoventures/adonis-jobs-ui-api/types'

import { formatTimestamp, formatDuration } from '@/lib/utils'

interface JobOverviewProps {
  job: JobRun
}

export function JobOverview({ job }: JobOverviewProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
        <Info className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Job Overview</h3>
      </div>

      <div className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
        <div>
          <h3 className="text-lg font-semibold mb-4">Job Information</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Queue:</span>
              <span className="font-mono">{job.queueName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Attempts:</span>
              <span>
                {job.attempts} / {job.maxAttempts}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>{formatTimestamp(job.createdAt)}</span>
            </div>
            {job.startedAt && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Started:</span>
                <span>{formatTimestamp(job.startedAt)}</span>
              </div>
            )}
            {job.completedAt && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Completed:</span>
                <span>{formatTimestamp(job.completedAt)}</span>
              </div>
            )}
            {job.duration && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span>{formatDuration(job.duration)}</span>
              </div>
            )}
            {job.progress && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span>{job.progress.percentage}%</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Job Data</h3>
          <div className="bg-card border rounded-lg p-4">
            <pre className="text-xs overflow-auto">{JSON.stringify(job.data, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Job Options</h3>
          <div className="bg-card border rounded-lg p-4">
            <pre className="text-xs overflow-auto">Options are not available for this job.</pre>
          </div>
        </div>

        {job.returnValue && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Return Value</h3>
            <div className="bg-card border border-green-900 rounded-lg p-4">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(job.returnValue, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {job.error && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Error Details</h3>
            <div className="bg-card border border-red-900 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{job.error.message}</p>
              {job.error.stack && (
                <pre className="text-xs pb-4 mt-2 text-red-500 dark:text-red-400 overflow-auto">
                  {job.error.stack}
                </pre>
              )}
            </div>
          </div>
        )}

        {(job.isFlowJob || job.flowId) && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Flow Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Is Flow Job:</span>
                <span>{job.isFlowJob ? 'Yes' : 'No'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Is Root Job:</span>
                <span>{job.isRootJob ? 'Yes' : 'No'}</span>
              </div>
              {job.flowId && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Flow ID:</span>
                  <span className="font-mono">{job.flowId}</span>
                </div>
              )}
              {job.flowKey && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Flow Key:</span>
                  <span className="font-mono">{job.flowKey}</span>
                </div>
              )}
              {job.parentJobId && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Parent Job:</span>
                  <span className="font-mono">{job.parentJobId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
