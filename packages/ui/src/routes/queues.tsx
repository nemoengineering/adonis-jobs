import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Play, Pause, MoreHorizontal, Trash2 } from 'lucide-react'
import type { QueueInfo } from '@nemoventures/adonis-jobs-ui-api/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Page, PageHeader } from '@/components/layout/page'
import { CleanQueueModal } from '@/components/clean-queue-modal'
import { getQueuesQueryOptions, useToggleQueuePause } from '@/queries'
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
  const [cleanModalOpen, setCleanModalOpen] = useState(false)

  const handleTogglePause = async () => {
    await toggleQueuePause.mutateAsync({ queueName: queue.name, pause: !queue.isPaused })
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleTogglePause()}
            disabled={toggleQueuePause.isPending}
          >
            {queue.isPaused ? (
              <>
                <Play className="mr-2 size-4" />
                Resume Queue
              </>
            ) : (
              <>
                <Pause className="mr-2 size-4" />
                Pause Queue
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCleanModalOpen(true)}>
            <Trash2 className="mr-2 size-4" />
            Clean Queue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CleanQueueModal
        isOpen={cleanModalOpen}
        onClose={() => setCleanModalOpen(false)}
        queueName={queue.name}
      />
    </div>
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
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Failed</TableHead>
              <TableHead className="text-center">Delayed</TableHead>
              <TableHead className="text-center">Paused</TableHead>
              <TableHead className="text-center">Concurrency</TableHead>
              <TableHead className="w-10 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
                    <Badge variant="outline">{queue.stats.active}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{queue.stats.completed}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={'outline'}>{queue.stats.failed}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{queue.stats.delayed}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{queue.stats.paused}</Badge>
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
