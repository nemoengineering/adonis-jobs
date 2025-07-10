import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Loader2, Play, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { Page, PageHeader } from '@/components/layout/page'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getAvailableJobsQueryOptions, useDispatchJob } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/test')({
  component: TestPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(getAvailableJobsQueryOptions()),
})

export function TestPage() {
  const [selectedJob, setSelectedJob] = useState('')
  const [jobData, setJobData] = useState<string>('{}')

  const { data: availableJobs } = useSuspenseQuery(getAvailableJobsQueryOptions())
  const dispatchJobMutation = useDispatchJob()

  const selectedJobInfo = availableJobs?.find((job) => job.name === selectedJob)

  const jobOptions =
    availableJobs?.map((job) => ({
      value: job.name,
      label: `${job.name}${job.defaultQueue ? ` (${job.defaultQueue})` : ''}`,
    })) || []

  const handleDispatch = async () => {
    if (!selectedJob || !selectedJobInfo?.defaultQueue) {
      return
    }

    await dispatchJobMutation.mutateAsync({
      jobName: selectedJob,
      queueName: selectedJobInfo.defaultQueue,
      data: JSON.parse(jobData),
    })

    setJobData('{}')
  }

  return (
    <Page>
      <PageHeader
        title="Test Jobs"
        description="Dispatch jobs manually with custom data for testing purposes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Configuration</CardTitle>
            <CardDescription>Select a job and configure its parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job</Label>
              <Combobox
                options={jobOptions}
                value={selectedJob}
                onValueChange={setSelectedJob}
                placeholder="Select a job..."
                searchPlaceholder="Search jobs..."
                emptyMessage="No jobs found."
                className="w-[220px]"
              />
            </div>

            {selectedJobInfo && (
              <div className="rounded-lg bg-muted p-3">
                <h4 className="font-medium mb-2">Job Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Name:</span> {selectedJobInfo.name}
                  </div>
                  {selectedJobInfo.defaultQueue && (
                    <div>
                      <span className="font-medium">Default Queue:</span>{' '}
                      {selectedJobInfo.defaultQueue}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleDispatch}
              disabled={
                !selectedJob || !selectedJobInfo?.defaultQueue || dispatchJobMutation.isPending
              }
              className="w-full"
            >
              {dispatchJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Dispatch Job
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Data</CardTitle>
            <CardDescription>Enter the JSON data that will be passed to the job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-data">JSON Data</Label>
              <Textarea
                id="job-data"
                placeholder="Enter JSON data..."
                value={jobData}
                onChange={(e) => setJobData(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter valid JSON data that will be passed to the job's process method
              </p>
            </div>

            {jobData && (
              <div className="space-y-2">
                <Label>Data Preview</Label>
                <div className="rounded-lg bg-muted p-3">
                  <pre className="text-xs overflow-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(jobData), null, 2)
                      } catch {
                        return 'Invalid JSON'
                      }
                    })()}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {dispatchJobMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {dispatchJobMutation.error instanceof Error
              ? dispatchJobMutation.error.message
              : 'Failed to dispatch job'}
          </AlertDescription>
        </Alert>
      )}

      {dispatchJobMutation.isSuccess && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Job dispatched successfully! ID: {dispatchJobMutation.data?.jobId}
          </AlertDescription>
        </Alert>
      )}
    </Page>
  )
}
