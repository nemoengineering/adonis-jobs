import { Play, Pause } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { QueueInfo } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Page, PageHeader } from '@/components/layout/page'
import { getQueuesQueryOptions, useToggleQueuePause } from '@/queries'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/queues')({
  component: QueuesPage,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(getQueuesQueryOptions()),
})

function getStatusBadge(status: string) {
  const variants = {
    active: 'default',
    paused: 'secondary',
    error: 'destructive',
  } as const

  return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
}

function QueueActionButton({ queue }: { queue: QueueInfo }) {
  const toggleQueuePause = useToggleQueuePause()

  const handleTogglePause = async () => {
    await toggleQueuePause.mutateAsync({ queueName: queue.name, pause: !queue.isPaused })
  }

  return (
    <Button
      // variant="outline"
      size="sm"
      onClick={handleTogglePause}
      disabled={toggleQueuePause.isPending}
      className="min-w-[80px]"
    >
      {queue.isPaused ? (
        <>
          <Play className="mr-1 size-3" />
          Resume
        </>
      ) : (
        <>
          <Pause className="mr-1 size-3" />
          Pause
        </>
      )}
    </Button>
  )
}

function QueuesPage() {
  const { data: queuesData } = useSuspenseQuery(getQueuesQueryOptions())
  const queues = queuesData?.queues || []

  return (
    <Page>
      <PageHeader title="Queues" description={`Manage and monitor your job queues`} />

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Queue Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Waiting</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-center">Failed</TableHead>
              <TableHead className="text-center">Concurrency</TableHead>
              <TableHead className="w-10 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No queues found. Make sure your jobs are properly configured.
                </TableCell>
              </TableRow>
            ) : (
              queues.map((queue) => (
                <TableRow key={queue.name}>
                  <TableCell className="font-medium px-4">{queue.name}</TableCell>
                  <TableCell>{getStatusBadge(queue.status)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{queue.stats.waiting}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{queue.stats.active}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={queue.stats.failed > 0 ? 'destructive' : 'outline'}>
                      {queue.stats.failed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{queue.concurrency}</TableCell>
                  <TableCell className="px-4">
                    <QueueActionButton queue={queue} />
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
