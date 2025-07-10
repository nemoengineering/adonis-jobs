import { useState } from 'react'
import { Loader2, MoreVertical } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { JobStatus, GetJobRunsValidator } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from '@/components/ui/badge'
import { formatTimestamp } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useJobRuns } from '@/hooks/use-dashboard'
import { Pagination } from '@/components/ui/pagination'
import { RunsToolbar } from './-components/runs-toolbar'
import { Page, PageHeader } from '@/components/layout/page'
import { JobStatusBadge } from '@/components/job-status-badge'
import { JobDurationCell } from './-components/job-duration-cell'
import { JobActionsDropdown } from '@/components/job-actions-dropdown'
import { DurationHeaderWithTooltip } from './-components/duration-header-tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/runs/')({
  component: RunsPage,
})

export function RunsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [sortBy, setSortBy] = useState<GetJobRunsValidator['sortBy']>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [status, setStatus] = useState<JobStatus[]>([])
  const [onlyRootJobs, setOnlyRootJobs] = useState(true)

  const handleStatusChange = (values: string[]) => {
    setStatus(values as JobStatus[])
  }

  const handleJobClick = (jobId: string) => {
    navigate({ to: '/runs/$jobId', params: { jobId } })
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
        <RunsToolbar
          status={status}
          onStatusChange={handleStatusChange}
          onlyRootJobs={onlyRootJobs}
          onOnlyRootJobsChange={setOnlyRootJobs}
        />
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
              <TableHead className="cursor-pointer hover:bg-muted/50">
                <DurationHeaderWithTooltip />
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50">Attempts</TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    <JobDurationCell run={run} />
                  </TableCell>
                  <TableCell>
                    <span className={run.attempts > 1 ? 'text-yellow-600' : ''}>
                      {run.attempts} / {run.maxAttempts}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <JobActionsDropdown jobId={run.id} jobStatus={run.status} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {runsData && (
          <Pagination
            currentPage={runsData.currentPage}
            hasNextPage={runsData.hasNextPage}
            hasPreviousPage={runsData.hasPreviousPage}
            onPageChange={setPage}
          />
        )}
      </div>
    </Page>
  )
}
