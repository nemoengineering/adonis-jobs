import type { JobRun } from '@nemoventures/adonis-jobs-ui-api/types'

import type {
  FlowJobNode,
  FlowJobEdge,
  FlowVisualizationData,
  FlowHierarchy,
} from '@/features/flows/types/flow'

export class FlowVisualizationService {
  /**
   * Get edge color based on job statuses
   */
  static #getEdgeColor(parent: JobRun, child: JobRun): string {
    if (parent.status === 'failed') return '#ef4444'
    if (parent.status === 'completed' && child.status === 'active') return '#3b82f6'
    if (parent.status === 'completed' && child.status === 'completed') return '#10b981'
    if (parent.status === 'active') return '#f59e0b'

    return '#6b7280'
  }

  /**
   * Determine dependency type between jobs
   */
  static #getDependencyType(parent: JobRun, _child: JobRun): 'success' | 'failure' | 'completion' {
    if (parent.status === 'failed') return 'failure'
    if (parent.status === 'completed') return 'success'
    return 'completion'
  }

  /**
   * Build flow hierarchy from a list of jobs
   */
  static buildFlowHierarchy(jobs: JobRun[]): FlowHierarchy {
    const rootJob = jobs.find((job) => job.isRootJob || !job.parentJobId)
    if (!rootJob) throw new Error('No root job found in the provided jobs list')

    const children = new Map<string, JobRun[]>()

    for (const job of jobs) {
      if (job.parentJobId) {
        if (!children.has(job.parentJobId)) children.set(job.parentJobId, [])

        children.get(job.parentJobId)!.push(job)
      }
    }

    return { root: rootJob, children }
  }

  /**
   * Convert flow hierarchy to React Flow nodes and edges
   */
  static convertToReactFlow(hierarchy: FlowHierarchy): FlowVisualizationData {
    const nodes: FlowJobNode[] = []
    const edges: FlowJobEdge[] = []

    const createNodesRecursively = (job: JobRun, level: number) => {
      const node: FlowJobNode = {
        id: job.id,
        type: 'flowJob',
        position: { x: 0, y: 0 },
        data: { job, isRoot: job.isRootJob || level === 0, level },
        draggable: true,
      }

      nodes.push(node)

      const children = hierarchy.children.get(job.id) || []
      for (const child of children) {
        edges.push({
          id: `${job.id}-${child.id}`,
          source: job.id,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: this.#getEdgeColor(job, child), strokeWidth: 2 },
          data: { dependency: this.#getDependencyType(job, child) },
        })

        createNodesRecursively(child, level + 1)
      }
    }

    createNodesRecursively(hierarchy.root, 0)

    return { nodes, edges }
  }
}
