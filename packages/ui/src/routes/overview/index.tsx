import { Activity, AlertTriangle } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { formatTimestamp } from '@/lib/utils'
import { Page, PageHeader } from '@/components/layout/page'
import { JobStatusBadge } from '@/components/job-status-badge'
import { getOverviewQueryOptions } from '@/hooks/use-dashboard'
import { OverviewStats } from '@/routes/overview/-components/overview-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/overview/')({
  component: OverviewPage,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(getOverviewQueryOptions()),
})

export function OverviewPage() {
  const { data: overview } = useSuspenseQuery(getOverviewQueryOptions())

  return (
    <Page>
      <PageHeader title="Overview" />

      <OverviewStats
        stats={{
          totalJobs: overview.globalStats.totalJobs,
          activeJobs: overview.globalStats.activeJobs,
          completedJobs: overview.globalStats.completedJobs,
          failedJobs: overview.globalStats.failedJobs,
          waitingJobs: overview.globalStats.waitingJobs,
          jobsPerMinute: overview.performanceMetrics.jobsPerMinute,
          jobsLastHour: overview.performanceMetrics.jobsPerHour,
          averageProcessingTime: overview.performanceMetrics.averageProcessingTime,
          successRate: overview.performanceMetrics.successRate,
          totalQueues: overview.globalStats.totalQueues,
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recentActivity.recentJobs.length > 0 ? (
              overview.recentActivity.recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.name}</p>
                    <p className="text-xs text-muted-foreground">{job.queueName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <JobStatusBadge status={job.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(job.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">Recent Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.recentActivity.recentErrors.length > 0 ? (
              overview.recentActivity.recentErrors.map((error) => (
                <div key={error.jobId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{error.jobName}</p>
                      <p className="text-xs text-muted-foreground">{error.queueName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(error.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-white bg-red-900 p-2 rounded ">{error.error}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No recent errors</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}
