import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { JobStatus } from '@nemoventures/adonis-jobs-ui-api/types'

import { useCleanQueue } from '@/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CleanQueueModalProps {
  isOpen: boolean
  onClose: () => void
  queueName: string
}

const JOB_STATUSES = [
  { value: JobStatus.Completed, label: 'Completed', variant: 'default' as const },
  { value: JobStatus.Failed, label: 'Failed', variant: 'destructive' as const },
  { value: JobStatus.Active, label: 'Active', variant: 'secondary' as const },
  { value: JobStatus.Waiting, label: 'Waiting', variant: 'outline' as const },
  { value: JobStatus.Delayed, label: 'Delayed', variant: 'outline' as const },
  { value: JobStatus.Paused, label: 'Paused', variant: 'secondary' as const },
]

export function CleanQueueModal({ isOpen, onClose, queueName }: CleanQueueModalProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [cleanAll, setCleanAll] = useState(true)
  const cleanQueue = useCleanQueue()

  const handleStatusToggle = (status: string) => {
    if (cleanAll) return

    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const handleCleanAllToggle = (checked: boolean) => {
    setCleanAll(checked)
    if (checked) {
      setSelectedStatuses([])
    }
  }

  const handleClean = async () => {
    const statuses = cleanAll ? undefined : selectedStatuses
    await cleanQueue.mutateAsync({ queueName, statuses })

    onClose()
    setSelectedStatuses([])
    setCleanAll(false)
  }

  const canClean = cleanAll || selectedStatuses.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            Clean Queue: {queueName}
          </DialogTitle>
          <DialogDescription>
            Select which job statuses you want to clean from the queue. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="clean-all" checked={cleanAll} onCheckedChange={handleCleanAllToggle} />
              <label htmlFor="clean-all" className="text-sm font-medium">
                Clean all jobs (all statuses)
              </label>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground mb-3">
                Or select specific statuses to clean:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {JOB_STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                      disabled={cleanAll}
                    />
                    <label
                      htmlFor={status.value}
                      className={`text-sm cursor-pointer ${cleanAll ? 'opacity-50' : ''}`}
                    >
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cleanQueue.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClean}
            disabled={!canClean || cleanQueue.isPending}
          >
            {cleanQueue.isPending ? 'Cleaning...' : 'Clean Queue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
