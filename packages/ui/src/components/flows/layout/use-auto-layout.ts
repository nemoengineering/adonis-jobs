import { useEffect, useState } from 'react'
import type { ReactFlowState } from '@xyflow/react'
import { useNodesInitialized, useReactFlow, useStore, Position } from '@xyflow/react'

import dagreLayout from './algorithms/dagre'
import type { Direction } from './algorithms'

const nodeCountSelector = (state: ReactFlowState) => state.nodeLookup.size

function useAutoLayout() {
  const [isLayoutApplied, setIsLayoutApplied] = useState(false)
  const { setNodes, setEdges, getNodes, getEdges, fitView } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const nodeCount = useStore(nodeCountSelector)

  useEffect(() => {
    if (!nodesInitialized || nodeCount === 0) return

    const runLayout = async () => {
      const nodes = getNodes().map((node) => ({ ...node }))
      const edges = getEdges().map((edge) => ({ ...edge }))

      const { nodes: nextNodes, edges: nextEdges } = await dagreLayout(nodes, edges, {
        spacing: [350, 350],
        direction: 'TB',
      })

      for (const node of nextNodes) {
        node.style = { ...node.style, opacity: 1 }
        node.sourcePosition = getSourceHandlePosition('TB')
        node.targetPosition = getTargetHandlePosition('TB')
      }

      for (const edge of edges) {
        edge.style = { ...edge.style, opacity: 1 }
      }

      setNodes(nextNodes)
      setEdges(nextEdges)

      if (!isLayoutApplied) {
        setTimeout(() => fitView({ padding: 0.2 }), 50)
        setIsLayoutApplied(true)
      }
    }

    runLayout()
  }, [nodesInitialized, nodeCount, setNodes, setEdges, getNodes, getEdges, fitView])
}

export default useAutoLayout

export function getSourceHandlePosition(direction: Direction) {
  switch (direction) {
    case 'TB':
      return Position.Bottom
    case 'BT':
      return Position.Top
    case 'LR':
      return Position.Right
    case 'RL':
      return Position.Left
  }
}

export function getTargetHandlePosition(direction: Direction) {
  switch (direction) {
    case 'TB':
      return Position.Top
    case 'BT':
      return Position.Bottom
    case 'LR':
      return Position.Left
    case 'RL':
      return Position.Right
  }
}
