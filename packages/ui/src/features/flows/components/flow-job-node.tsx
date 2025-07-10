import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

import { BaseNode } from './base-node'
import { cn, formatDuration } from '@/lib/utils'
import { getJobStatusConfig } from '@/lib/job-status-config'
import { NodeStatusIndicator } from './node-status-indicator'
import type { FlowJobNode } from '@/features/flows/types/flow'
import { JobStatusBadge } from '@/components/job-status-badge'
import { JobActionsDropdown } from '../../../components/job-actions-dropdown'
import {
  NodeHeader,
  NodeHeaderTitle,
  NodeHeaderActions,
  NodeHeaderMenuAction,
  NodeHeaderIcon,
} from './node-header'

interface FlowJobNodeProps {
  data: FlowJobNode['data']
}

export const FlowJobNodeComponent = memo(({ data }: FlowJobNodeProps) => {
  const { job, isRoot, isSelected } = data

  function getStatusIcon() {
    const config = getJobStatusConfig(job.status)
    const IconComponent = config.icon
    return <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
  }

  function getProgressPercentage() {
    if (job.progress?.percentage) return job.progress.percentage

    return job.status === 'completed' ? 100 : 0
  }

  function getNodeStatus() {
    switch (job.status) {
      case 'active':
        return 'loading'
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      default:
        return 'initial'
    }
  }

  const progressPercentage = getProgressPercentage()

  return (
    <NodeStatusIndicator status={getNodeStatus()}>
      <BaseNode
        className={cn(
          'min-w-[280px] pt-2 bg-(--slate-2)',
          isSelected ? 'border-blue-500 border' : 'border-gray-600',
        )}
      >
        <Handle type="target" position={Position.Top} isConnectable={false} />
        <Handle type="source" position={Position.Bottom} isConnectable={false} />

        <NodeHeader className="-mt-2 border-b border-gray-600">
          <NodeHeaderIcon>{getStatusIcon()}</NodeHeaderIcon>
          <NodeHeaderTitle className="truncate max-w-[180px]" title={job.name}>
            {job.name}
          </NodeHeaderTitle>
          {isRoot && (
            <span className="text-xs bg-blue-500 text-blue-100 px-2 rounded font-bold">Root</span>
          )}
          <NodeHeaderActions>
            <NodeHeaderMenuAction label="Job actions">
              <JobActionsDropdown jobId={job.id} jobStatus={job.status}>
                {/* Actions will be rendered by JobActionsDropdown */}
              </JobActionsDropdown>
            </NodeHeaderMenuAction>
          </NodeHeaderActions>
        </NodeHeader>

        <div className="mt-2 px-3 pb-2">
          <div className="flex items-center justify-between">
            <JobStatusBadge status={job.status} />
            <span className="text-xs text-gray-500 font-mono">{job.id.slice(0, 8)}...</span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {(job.progress?.percentage !== undefined || job.status === 'completed') && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Progress</span>
                <span className="text-gray-300">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    job.status === 'failed'
                      ? 'bg-red-500'
                      : job.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="text-gray-300">Attempts</div>
              <div className="font-mono">
                {job.attempts}/{job.maxAttempts}
              </div>
            </div>

            {job.duration && (
              <div className="space-y-1">
                <div className="text-gray-300">Duration</div>
                <div className="font-mono">{formatDuration(job.duration)}</div>
              </div>
            )}
          </div>

          {job.error && (
            <div className="mt-2 p-2 bg-red-900 rounded text-xs">
              <div className="font-medium text-red-200">Error</div>
              <div className="text-red-300 truncate" title={job.error.message}>
                {job.error.message}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              Queue: <span className="font-mono">{job.queueName}</span>
            </div>
          </div>
        </div>
      </BaseNode>
    </NodeStatusIndicator>
  )
})
