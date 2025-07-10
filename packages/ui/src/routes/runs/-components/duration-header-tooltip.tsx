import { Info, Clock, Play } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function DurationHeaderWithTooltip() {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger className="flex items-center gap-1">
          <span>Duration</span>
          <Info className="size-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-80">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Duration Breakdown</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="font-medium text-sm">Queued Duration</div>
                  <div className="text-xs text-muted-foreground">
                    Time from job creation to start of execution
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">Run Duration</div>
                  <div className="text-xs text-muted-foreground">
                    Total execution time from start to completion
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
