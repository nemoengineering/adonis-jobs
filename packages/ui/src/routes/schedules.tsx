import dayjs from 'dayjs'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { MoreHorizontal, Clock, Calendar } from 'lucide-react'
import type { ScheduleInfo } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSchedulesQueryOptions } from '@/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="@container/main h-full">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedules</h1>
            <p className="text-muted-foreground">Manage and monitor your scheduled jobs</p>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.schedules.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No schedules found. Create repeatable jobs to see them here.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule Name</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Pattern/Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Job Template</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
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
                      <TableCell>
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
