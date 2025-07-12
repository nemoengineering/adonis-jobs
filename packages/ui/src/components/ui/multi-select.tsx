'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface MultiSelectOption {
  value: string
  label: string
  icon?: React.ComponentType<any>
  iconClassName?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  maxDisplayItems?: number
  showClearButton?: boolean
}

export function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No option found.',
  className,
  maxDisplayItems = 3,
  showClearButton = true,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((option) => value.includes(option.value))

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onValueChange?.(newValue)
  }

  const handleRemove = (optionValue: string) => {
    const newValue = value.filter((v) => v !== optionValue)
    onValueChange?.(newValue)
  }

  const handleClearAll = () => {
    onValueChange?.([])
  }

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder
    }

    if (selectedOptions.length <= maxDisplayItems) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs h-5 px-1.5 flex items-center gap-1"
            >
              {option.label}
              <div
                role="button"
                tabIndex={0}
                className="h-3 w-3 p-0 hover:bg-destructive/10 ml-1 rounded-sm flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemove(option.value)
                }}
              >
                <X className="h-2 w-2 text-muted-foreground hover:text-destructive" />
              </div>
            </Badge>
          ))}
        </div>
      )
    }

    return `${selectedOptions.length} selected`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn('justify-between', className)}>
          <div className="flex-1 text-left">{displayText()}</div>
          <div className="flex items-center gap-1">
            {showClearButton && selectedOptions.length > 0 && (
              <div
                role="button"
                tabIndex={0}
                className="h-4 w-4 p-0 hover:bg-destructive/10 rounded-sm flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClearAll()
                }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const OptionIcon = option.icon
                const isSelected = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {OptionIcon && (
                        <OptionIcon className={cn('mr-2 h-4 w-4', option.iconClassName)} />
                      )}
                      {option.label}
                    </div>
                    <Check className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
