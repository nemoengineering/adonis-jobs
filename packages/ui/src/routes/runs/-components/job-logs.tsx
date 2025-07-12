import { ScrollText, FileText } from 'lucide-react'
import type { JobRun } from '@nemoventures/adonis-jobs-ui-api/types'

interface Props {
  job: JobRun
}

export function JobLogs({ job }: Props) {
  const hasLogs = job.logs && job.logs.length > 0

  if (!hasLogs) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-3">
          <FileText className="h-12 w-12 mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium">No logs available</p>
            <p className="text-sm">This job hasn't produced any logs yet.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Job Logs</h3>
        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
          {job.logs!.length} entries
        </span>
      </div>

      <div className="p-4 space-y-2 flex-1 min-h-0 overflow-y-auto">
        {job.logs!.map((log, index) => (
          <div
            key={index}
            className="group relative border flex gap-3 text-sm font-mono leading-relaxed"
          >
            <div className="flex-1 min-w-0">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground bg-muted/20 rounded px-3 py-2 hover:bg-muted/40 transition-colors">
                {log}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
