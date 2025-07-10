import { ArrowLeft } from 'lucide-react'
import { ReactFlowProvider } from '@xyflow/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { JobLogs } from '@/routes/runs/-components/job-logs'
import { JobStatusBadge } from '@/components/job-status-badge'
import { FlowVisualization } from '@/components/flow-visualization'
import { JobOverview } from '@/routes/runs/-components/job-overview'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getFlowJobsTreeQueryOptions, getJobByIdQueryOptions } from '@/hooks/use-dashboard'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

export const Route = createFileRoute('/runs/$jobId')({
  staticData: { fullScreenMode: true },
  component: JobDetailsPage,
  loader: ({ context: { queryClient }, params }) => {
    return Promise.all([
      queryClient.ensureQueryData(getJobByIdQueryOptions(params.jobId)),
      queryClient.ensureQueryData(getFlowJobsTreeQueryOptions(params.jobId)),
    ])
  },
})

function JobDetailsPage() {
  const { jobId } = Route.useParams()
  const { data: job } = useSuspenseQuery(getJobByIdQueryOptions(jobId))
  const router = useRouter()

  const { data: flowJobs } = useSuspenseQuery(getFlowJobsTreeQueryOptions(jobId))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b bg-background/95 flex-shrink-0">
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

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={70} minSize={30}>
            <div className="h-full">
              <ReactFlowProvider>
                <FlowVisualization
                  jobs={flowJobs}
                  selectedJob={job}
                  onJobSelect={(selectedJob) => {
                    if (selectedJob.id === jobId) return
                    router.navigate({ to: '/runs/$jobId', params: { jobId: selectedJob.id } })
                  }}
                />
              </ReactFlowProvider>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={20} maxSize={70}>
            <div className="h-full flex flex-col">
              <Tabs defaultValue="overview" className="h-full flex flex-col">
                <div className="border-b p-2 flex-shrink-0">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="flex-1 min-h-0 flex flex-col">
                  <JobOverview job={job} />
                </TabsContent>

                <TabsContent value="logs" className="flex-1 min-h-0 flex flex-col">
                  <JobLogs job={job} />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
