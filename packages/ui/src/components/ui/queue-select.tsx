import { Check, ChevronsUpDown } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { getQueuesQueryOptions } from '@/queries'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'

interface QueueSelectProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  className?: string
}

export function QueueSelect(props: QueueSelectProps) {
  const { value, onValueChange, placeholder = 'Select queue...', className } = props

  const { data: queuesData } = useSuspenseQuery(getQueuesQueryOptions())
  const queues = queuesData?.queues || []

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? undefined : selectedValue
    onValueChange(newValue)
  }

  const selectedQueue = queues.find((queue) => queue.name === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn('justify-between', className)}>
          {selectedQueue ? selectedQueue.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search queues..." />
          <CommandList>
            <CommandEmpty>No queues found.</CommandEmpty>
            <CommandGroup>
              {queues.map((queue) => (
                <CommandItem key={queue.name} onSelect={() => handleSelect(queue.name)}>
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === queue.name ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {queue.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
