import { JobStatus } from '@nemoventures/adonis-jobs-ui-api/types'
import {
  IconCheck,
  IconLoader,
  IconX,
  IconClock,
  IconClockPause,
  IconPlayerPause,
} from '@tabler/icons-react'

export interface JobStatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ComponentType<any>
  className: string
  label: string
  iconColor: string
}

export const JOB_STATUS_CONFIG: Record<JobStatus, JobStatusConfig> = {
  [JobStatus.Completed]: {
    variant: 'default',
    icon: IconCheck,
    className: 'bg-green-900 text-foreground',
    label: 'Completed',
    iconColor: 'text-foreground',
  },
  [JobStatus.Active]: {
    variant: 'secondary',
    icon: IconLoader,
    className: 'bg-blue-900 text-blue-100',
    label: 'Active',
    iconColor: 'text-blue-500',
  },
  [JobStatus.Failed]: {
    variant: 'destructive',
    icon: IconX,
    className: 'bg-red-900 text-red-100',
    label: 'Failed',
    iconColor: 'text-red-500',
  },
  [JobStatus.Waiting]: {
    variant: 'outline',
    icon: IconClock,
    className: 'bg-yellow-900 text-yellow-100',
    label: 'Waiting',
    iconColor: 'text-yellow-500',
  },
  [JobStatus.Delayed]: {
    variant: 'secondary',
    icon: IconClockPause,
    className: 'bg-orange-900 text-orange-100',
    label: 'Delayed',
    iconColor: 'text-orange-500',
  },
  [JobStatus.Paused]: {
    variant: 'secondary',
    icon: IconPlayerPause,
    className: 'bg-gray-800 text-gray-100',
    label: 'Paused',
    iconColor: 'text-gray-500',
  },
  [JobStatus.Unknown]: {
    variant: 'outline',
    icon: IconClock,
    className: '',
    label: 'Unknown',
    iconColor: 'text-gray-500',
  },
}

export function getJobStatusConfig(status: JobStatus | string): JobStatusConfig {
  return JOB_STATUS_CONFIG[status as JobStatus] || JOB_STATUS_CONFIG[JobStatus.Unknown]
}

export function createStatusOption(status: JobStatus) {
  const config = JOB_STATUS_CONFIG[status]
  return { value: status, label: config.label, icon: config.icon, iconClassName: config.iconColor }
}
