import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { JobStatus, type GetJobRunsValidator } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useJobRuns } from '@/hooks/use-dashboard'
import { MultiSelect } from '@/components/ui/multi-select'
import { Page, PageHeader } from '@/components/layout/page'
import { createStatusOption } from '@/lib/job-status-config'
import { formatDuration, formatTimestamp } from '@/lib/utils'
import { JobStatusBadge } from '@/components/job-status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/runs')({
  component: RunsPage,
})

export function RunsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [sortBy, setSortBy] = useState<GetJobRunsValidator['sortBy']>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [status, setStatus] = useState<JobStatus[]>([])
  const [onlyRootJobs, setOnlyRootJobs] = useState(false)

  const handleStatusChange = (values: string[]) => {
    setStatus(values as JobStatus[])
  }

  const handleJobClick = (jobId: string) => {
    navigate({ to: '/run/$jobId', params: { jobId } })
  }

  const {
    data: runsData,
    isLoading,
    error,
  } = useJobRuns({
    page,
    limit,
    sortBy,
    sortOrder,
    status: status.length > 0 ? status : undefined,
    onlyRootJobs: onlyRootJobs ? true : undefined,
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading job runs...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading runs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Failed to load job runs'}
          </p>
        </div>
      </div>
    )
  }

  const runs = runsData?.items || []

  const statusOptions = [
    createStatusOption(JobStatus.Active),
    createStatusOption(JobStatus.Waiting),
    createStatusOption(JobStatus.Delayed),
    createStatusOption(JobStatus.Completed),
    createStatusOption(JobStatus.Failed),
    createStatusOption(JobStatus.Paused),
  ]

  const handleSort = (field: GetJobRunsValidator['sortBy']) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <Page>
      <PageHeader title="Job Runs" description={`View and manage recent job executions`}>
        <div className="flex items-center space-x-4">
          <MultiSelect
            options={statusOptions}
            value={status}
            onValueChange={handleStatusChange}
            placeholder="Filter by status..."
            className="w-[220px]"
            maxDisplayItems={2}
          />
          <div className="flex items-center space-x-2">
            <Switch checked={onlyRootJobs} onCheckedChange={setOnlyRootJobs} />
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Root jobs only
            </label>
          </div>
        </div>
      </PageHeader>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50">Job Name</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                Started {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('completedAt')}
              >
                Completed {sortBy === 'completedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50">Duration</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50">Attempts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No job runs found
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleJobClick(run.id)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{run.name}</span>
                        {run.isRootJob && (
                          <Badge variant="secondary" className="text-xs">
                            root
                          </Badge>
                        )}
                        {run.isFlowJob && !run.isRootJob && (
                          <Badge variant="outline" className="text-xs">
                            flow
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {run.id}</div>
                      {run.flowId && (
                        <div className="text-xs text-muted-foreground">
                          Flow ID: {run.flowId}
                          {run.flowKey && ` (${run.flowKey})`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{run.queueName}</Badge>
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={run.status} />
                    {run.error && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {run.error.message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatTimestamp(run.startedAt || run.createdAt)}</TableCell>
                  <TableCell>{formatTimestamp(run.completedAt || run.failedAt)}</TableCell>
                  <TableCell>
                    <span
                      className={run.duration && run.duration > 10_000 ? 'text-yellow-600' : ''}
                    >
                      {formatDuration(run.duration)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={run.attempts > 1 ? 'text-yellow-600' : ''}>
                      {run.attempts} / {run.maxAttempts}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {runsData && (runsData.hasPreviousPage || runsData.hasNextPage) && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">Page {runsData.currentPage}</div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!runsData.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!runsData.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}
