import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import type {
  DispatchJobRequest,
  GetJobRunsValidator,
} from '@nemoventures/adonis-jobs-ui-api/types'

import { dashboardApi } from '@/lib/dashboard-api'

const POLLING_INTERVAL = 1000

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardQueryKeys.all, 'overview'] as const,
  globalStats: () => [...dashboardQueryKeys.all, 'global-stats'] as const,
  jobRuns: (options?: GetJobRunsValidator) =>
    [...dashboardQueryKeys.all, 'job-runs', options] as const,
  jobById: (jobId: string) => [...dashboardQueryKeys.all, 'job-by-id', jobId] as const,
  flowJobs: (flowId: string) => [...dashboardQueryKeys.all, 'flow-jobs', flowId] as const,
  flowJobsTree: (jobId: string) => [...dashboardQueryKeys.all, 'flow-jobs-tree', jobId] as const,
  availableJobs: () => [...dashboardQueryKeys.all, 'available-jobs'] as const,
  queues: () => [...dashboardQueryKeys.all, 'queues'] as const,
  schedules: () => [...dashboardQueryKeys.all, 'schedules'] as const,
  jobDependencies: (jobId: string, queueName: string) =>
    [...dashboardQueryKeys.all, 'job-dependencies', jobId, queueName] as const,
} as const

export const getOverviewQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.overview(),
    queryFn: () => dashboardApi.getOverview(),
    refetchInterval: POLLING_INTERVAL,
  })

export const getGlobalStatsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.globalStats(),
    queryFn: () => dashboardApi.getGlobalStats(),
    refetchInterval: POLLING_INTERVAL,
  })

export const getJobRunsQueryOptions = (options: GetJobRunsValidator) =>
  queryOptions({
    queryKey: dashboardQueryKeys.jobRuns(options),
    queryFn: () => dashboardApi.getJobRuns(options),
    refetchInterval: POLLING_INTERVAL,
  })

export function useJobRuns(options: GetJobRunsValidator) {
  return useQuery(getJobRunsQueryOptions(options))
}

export const getAvailableJobsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.availableJobs(),
    queryFn: () => dashboardApi.getAvailableJobs(),
  })

export function useDispatchJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: DispatchJobRequest) => dashboardApi.dispatchJob(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.jobRuns() })
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.overview() })
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.globalStats() })
    },
  })
}

export const getQueuesQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.queues(),
    queryFn: () => dashboardApi.getQueues(),
    refetchInterval: POLLING_INTERVAL,
  })

export function useToggleQueuePause() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: { queueName: string; pause: boolean }) =>
      dashboardApi.toggleQueuePause(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.queues() })
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.overview() })
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.globalStats() })
    },
  })
}

export const getSchedulesQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.schedules(),
    queryFn: () => dashboardApi.getSchedules(),
    refetchInterval: POLLING_INTERVAL,
  })

export const getJobByIdQueryOptions = (jobId: string) =>
  queryOptions({
    queryKey: dashboardQueryKeys.jobById(jobId),
    queryFn: () => dashboardApi.getJobById(jobId),
    refetchInterval: POLLING_INTERVAL,
  })

export const getFlowJobsTreeQueryOptions = (jobId: string) =>
  queryOptions({
    queryKey: dashboardQueryKeys.flowJobsTree(jobId),
    queryFn: () => dashboardApi.getFlowJobsTree(jobId),
    refetchInterval: POLLING_INTERVAL,
  })
