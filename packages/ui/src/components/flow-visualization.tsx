import '@xyflow/react/dist/style.css'

import { useCallback, useMemo } from 'react'
import type { JobRun } from '@nemoventures/adonis-jobs-ui-api/types'
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
  type Node,
} from '@xyflow/react'

import useAutoLayout from './flows/layout/use-auto-layout'
import { FlowJobNodeComponent } from '@/components/flow-job-node'
import { FlowVisualizationService } from '@/services/flow-visualization'

interface FlowVisualizationProps {
  jobs: JobRun[]
  selectedJob?: JobRun
  onJobSelect?: (job: JobRun) => void
}

const nodeTypes: NodeTypes = {
  flowJob: FlowJobNodeComponent,
}

export function FlowVisualization({ jobs, selectedJob, onJobSelect }: FlowVisualizationProps) {
  const flowData = useMemo(() => {
    if (jobs.length === 0) return { nodes: [], edges: [] }

    const hierarchy = FlowVisualizationService.buildFlowHierarchy(jobs)
    return FlowVisualizationService.convertToReactFlow(hierarchy)
  }, [jobs])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      if (onJobSelect && node.data?.job) {
        onJobSelect(node.data.job)
      }
    },
    [onJobSelect],
  )

  useMemo(() => {
    setNodes(flowData.nodes as Node[])
    setEdges(flowData.edges)
  }, [flowData, setNodes, setEdges])

  const nodesWithSelection = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: selectedJob && (node.data as any)?.job?.id === selectedJob.id,
      },
    }))
  }, [nodes, selectedJob])

  useAutoLayout()

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
      </ReactFlow>
    </div>
  )
}
