import dayjs from 'dayjs'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { MoreHorizontal, Clock, Calendar } from 'lucide-react'
import type { ScheduleInfo } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSchedulesQueryOptions } from '@/queries'
import { Page, PageHeader } from '@/components/layout/page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/schedules')({
  component: SchedulesPage,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(getSchedulesQueryOptions()),
})

function getStatusBadge(status: string) {
  const variants = {
    active: 'default',
    paused: 'secondary',
    error: 'destructive',
  } as const

  return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
}

function formatPattern(schedule: ScheduleInfo) {
  if (schedule.pattern) {
    return (
      <div className="flex items-center gap-1">
        <Calendar className="size-3" />
        <code className="text-xs bg-muted px-1 py-0.5 rounded">{schedule.pattern}</code>
      </div>
    )
  }

  if (schedule.every) {
    const seconds = schedule.every / 1000
    if (seconds < 60) {
      return (
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          <span className="text-sm">Every {seconds}s</span>
        </div>
      )
    } else if (seconds < 3600) {
      const minutes = seconds / 60
      return (
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          <span className="text-sm">Every {minutes}m</span>
        </div>
      )
    }
    const hours = seconds / 3600
    return (
      <div className="flex items-center gap-1">
        <Clock className="size-3" />
        <span className="text-sm">Every {hours}h</span>
      </div>
    )
  }

  return <span className="text-muted-foreground">N/A</span>
}

function SchedulesPage() {
  const { data: schedules } = useSuspenseQuery(getSchedulesQueryOptions())

  return (
    <Page>
      <PageHeader title="Schedules" description="Manage and monitor your scheduled jobs" />

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Schedule Name</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead>Pattern/Interval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Job Template</TableHead>
              <TableHead className="w-10 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No schedules found. Create repeatable jobs to see them here.
                </TableCell>
              </TableRow>
            ) : (
              schedules.schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium px-4">{schedule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{schedule.queueName}</Badge>
                  </TableCell>
                  <TableCell>{formatPattern(schedule)}</TableCell>
                  <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {dayjs(schedule.nextRunAt).fromNow()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {schedule.jobTemplate?.name ? (
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {schedule.jobTemplate.name}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                        <DropdownMenuItem disabled>Pause Schedule</DropdownMenuItem>
                        <DropdownMenuItem disabled>Remove Schedule</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Page>
  )
}
