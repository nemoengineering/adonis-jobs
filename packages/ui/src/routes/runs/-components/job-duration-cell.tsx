import dayjs from 'dayjs'
import { Clock, Play } from 'lucide-react'

import { formatDuration } from '@/lib/utils'

interface JobDurationCellProps {
  run: {
    createdAt: string
    startedAt?: string | null
    completedAt?: string | null
    failedAt?: string | null
    duration?: number | null
  }
}

export function JobDurationCell({ run }: JobDurationCellProps) {
  function calculateDurations() {
    const createdAt = dayjs(run.createdAt).valueOf()
    const startedAt = run.startedAt ? dayjs(run.startedAt).valueOf() : null
    const completedAt = run.completedAt ? dayjs(run.completedAt).valueOf() : null
    const failedAt = run.failedAt ? dayjs(run.failedAt).valueOf() : null

    const queuedDuration = startedAt ? startedAt - createdAt : null

    // If we already have a duration from the run, use it
    if (run.duration) return { queuedDuration, runDuration: run.duration }

    // If job hasn't started, no run duration
    if (!startedAt) return { queuedDuration, runDuration: null }

    // Calculate duration from start to end (completed or failed)
    const endTime = completedAt || failedAt
    const runDuration = endTime ? endTime - startedAt : null

    return { queuedDuration, runDuration }
  }

  const { queuedDuration, runDuration } = calculateDurations()

  return (
    <div className="space-y-1">
      {queuedDuration !== null && (
        <div className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3 text-orange-500" />
          <span className="text-muted-foreground">Queue:</span>
          <span>{formatDuration(queuedDuration)}</span>
        </div>
      )}
      {runDuration !== null && (
        <div className="flex items-center gap-1 text-xs">
          <Play className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">Run:</span>
          <span className={runDuration > 10_000 ? 'text-yellow-600' : ''}>
            {formatDuration(runDuration)}
          </span>
        </div>
      )}
      {queuedDuration === null && runDuration === null && (
        <span className="text-muted-foreground text-xs">-</span>
      )}
    </div>
  )
}
