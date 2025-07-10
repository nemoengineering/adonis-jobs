import type { Node, Edge } from '@xyflow/react'
import type { JobRun } from '@nemoventures/adonis-jobs-ui-api/types'

export interface FlowJobNode
  extends Node<{
    job: JobRun
    isRoot: boolean
    level: number
    isSelected?: boolean
  }> {
  type: 'flowJob'
}

export interface FlowJobEdge extends Edge {
  data?: {
    dependency?: 'success' | 'failure' | 'completion'
  }
}

export interface FlowVisualizationData {
  nodes: FlowJobNode[]
  edges: FlowJobEdge[]
}

export interface FlowHierarchy {
  root: JobRun
  children: Map<string, JobRun[]>
}
