import { Clock, CheckCircle, XCircle, Activity, Zap, TrendingUp, Server } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className={cn('p-3')}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
          </div>
          <div className={cn('ml-2')}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OverviewStatsProps {
  stats: {
    totalJobs: number
    activeJobs: number
    completedJobs: number
    failedJobs: number
    waitingJobs: number
    jobsPerMinute: number
    jobsLastHour: number
    averageProcessingTime: number
    successRate: number
    totalQueues: number
  }
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Active" value={stats.activeJobs} icon={<Zap className="h-4 w-4" />} />
        <StatCard title="Waiting" value={stats.waitingJobs} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Failed" value={stats.failedJobs} icon={<XCircle className="h-4 w-4" />} />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <StatCard
          title="Total"
          value={
            stats.totalJobs > 999 ? `${(stats.totalJobs / 1000).toFixed(1)}k` : stats.totalJobs
          }
          icon={<Activity className="h-3 w-3" />}
        />
        <StatCard
          title="Per Min"
          value={stats.jobsPerMinute.toFixed(1)}
          icon={<TrendingUp className="h-3 w-3" />}
        />
        <StatCard
          title="Last Hour"
          value={
            stats.jobsLastHour > 999
              ? `${(stats.jobsLastHour / 1000).toFixed(1)}k`
              : stats.jobsLastHour
          }
          icon={<CheckCircle className="h-3 w-3" />}
        />
        <StatCard
          title="Avg Time"
          value={`${(stats.averageProcessingTime / 1000).toFixed(1)}s`}
          icon={<Clock className="h-3 w-3" />}
        />
        <StatCard title="Queues" value={stats.totalQueues} icon={<Server className="h-3 w-3" />} />
      </div>
    </div>
  )
}
