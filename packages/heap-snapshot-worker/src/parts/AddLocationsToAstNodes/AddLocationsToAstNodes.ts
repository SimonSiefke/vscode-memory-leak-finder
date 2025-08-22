import type { AstNode, ObjectNode } from '../AstNode/AstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { findClosureLocationsForObjectId } from '../FindClosureLocationsForNode/FindClosureLocationsForNode.ts'

const isObjectNode = (node: AstNode): node is ObjectNode => {
  return node.type === 'object'
}

export const addLocationsToAstNodes = (snapshot: Snapshot, nodes: readonly AstNode[]): readonly AstNode[] => {
  return nodes.map((node) => {
    if (isObjectNode(node)) {
      const locations = findClosureLocationsForObjectId(snapshot, node.id)
      if (locations.length) {
        const withLocations: ObjectNode = { ...node, closureLocations: locations }
        return withLocations
      }
    }
    return node
  })
}


