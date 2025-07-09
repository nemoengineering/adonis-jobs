import { ArrowLeft } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { formatTimestamp, formatDuration } from '@/lib/utils'
import { getJobByIdQueryOptions } from '@/hooks/use-dashboard'
import { JobStatusBadge } from '@/components/job-status-badge'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

export const Route = createFileRoute('/run/$jobId')({
  component: JobDetailsPage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(getJobByIdQueryOptions(params.jobId)),
})

function JobDetailsPage() {
  const { jobId } = Route.useParams()
  const { data: job } = useSuspenseQuery(getJobByIdQueryOptions(jobId))

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/runs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-lg font-bold tracking-tight">{job.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground relative top-[2px]">
                <span>
                  ID:{' '}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{job.id}</code>
                </span>
                <span>
                  Queue:{' '}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
                    {job.queueName}
                  </code>
                </span>
              </div>
            </div>
            <JobStatusBadge status={job.status} />
          </div>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="h-full p-6 bg-muted/20">
            <div className="h-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-lg font-semibold text-muted-foreground">Canvas Area</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Future job visualization will be displayed here
                </p>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20} maxSize={70}>
          <div className="h-full overflow-auto">
            <div className="p-6 space-y-6">
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
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-xs overflow-auto">{JSON.stringify(job.data, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Job Options</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-xs overflow-auto">
                    Options are not available for this job.
                  </pre>
                </div>
              </div>

              {job.returnValue && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Return Value</h3>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(job.returnValue, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {job.error && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Error Details</h3>
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
