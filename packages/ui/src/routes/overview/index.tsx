import { Activity, AlertTriangle } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

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
          <CardContent className="space-y-2">
            {overview.recentActivity.recentJobs.length > 0 ? (
              overview.recentActivity.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to="/run/$jobId"
                  params={{ jobId: job.id }}
                  className="block p-3 rounded-lg border hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate">{job.name}</p>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Queue: {job.queueName}</span>
                        <span>ID: {job.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(job.timestamp)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
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
          <CardContent className="space-y-2">
            {overview.recentActivity.recentErrors.length > 0 ? (
              overview.recentActivity.recentErrors.map((error) => (
                <Link
                  key={error.jobId}
                  to="/run/$jobId"
                  params={{ jobId: error.jobId }}
                  className="block p-3 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium truncate">{error.jobName}</p>
                          <JobStatusBadge status="failed" />
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Queue: {error.queueName}</span>
                          <span>ID: {error.jobId}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(error.timestamp)}
                      </span>
                    </div>
                    <div className="bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800 rounded p-2">
                      <p className="text-xs text-red-800 dark:text-red-200 font-mono leading-relaxed">
                        {error.error.length > 120
                          ? `${error.error.substring(0, 120)}...`
                          : error.error}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent errors</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}
