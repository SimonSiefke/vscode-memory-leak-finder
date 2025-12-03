import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getClosureReferences } from '../GetClosureReferences/GetClosureReferences.ts'

export interface LeakedClosureWithReferences {
  readonly nodeIndex: number
  readonly nodeName: string
  readonly nodeId: number
  readonly references: readonly {
    readonly sourceNodeIndex: number
    readonly sourceNodeId: number
    readonly sourceNodeName: string | null
    readonly sourceNodeType: string | null
    readonly edgeType: string
    readonly edgeName: string
    readonly path: string
  }[]
}

export const enrichLeakedClosuresWithReferences = (
  leakedClosures: Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>,
  snapshot: Snapshot,
): Record<string, readonly LeakedClosureWithReferences[]> => {
  const enriched: Record<string, LeakedClosureWithReferences[]> = {}
  const ITEMS_PER_NODE = snapshot.meta.node_fields.length

  for (const [locationKey, closures] of Object.entries(leakedClosures)) {
    enriched[locationKey] = closures.map((closure) => {
      // nodeIndex is a byte offset, convert to node index
      const nodeIndex = Math.floor(closure.nodeIndex / ITEMS_PER_NODE)
      const references = getClosureReferences(nodeIndex, snapshot)
      return {
        nodeIndex: closure.nodeIndex,
        nodeName: closure.nodeName,
        nodeId: closure.nodeId,
        references,
      }
    })
  }

  return enriched
}
