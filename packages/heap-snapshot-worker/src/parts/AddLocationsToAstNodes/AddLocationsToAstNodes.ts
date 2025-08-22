import type { AstNode, ObjectNode } from '../AstNode/AstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { findClosureLocationsForObjectId } from '../FindClosureLocationsForNode/FindClosureLocationsForNode.ts'
import { isObjectNode } from '../IsObjectNode/IsObjectNode.ts'

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
