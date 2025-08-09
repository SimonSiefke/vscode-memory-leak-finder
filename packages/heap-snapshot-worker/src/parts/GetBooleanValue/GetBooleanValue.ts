import type { Snapshot } from '../Snapshot/Snapshot.js'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'

/**
 * Attempts to determine if a node represents a boolean value (true/false)
 * In V8 heap snapshots, boolean values are typically represented as 'hidden' type nodes
 * We use various heuristics including node name, edge patterns, and context
 * @param targetNode - The node to check
 * @param snapshot - The heap snapshot data
 * @param edgeMap - Edge mapping for efficient traversal
 * @param propertyName - The property name this node is referenced by (for context)
 * @returns The boolean value as string ('true', 'false') or null if not a boolean
 */
export const getBooleanValue = (
  targetNode: any,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  propertyName?: string,
): string | null => {
  if (!targetNode) return null

  const { nodes, edges, strings, meta } = snapshot
  const nodeTypes = meta.node_types
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  
  const nodeTypeName = getNodeTypeName(targetNode, nodeTypes)
  
  // Booleans are typically 'hidden' type nodes
  if (nodeTypeName !== 'hidden') return null

  const nodeName = getNodeName(targetNode, strings)
  
  // Check if the node name explicitly indicates a boolean value
  if (nodeName === 'true' || nodeName === 'false') {
    return nodeName
  }

  // Property name context can give hints about boolean values
  if (propertyName) {
    const lowerPropName = propertyName.toLowerCase()
    const booleanIndicators = [
      'expanded', 'visible', 'enabled', 'disabled', 'active', 'inactive',
      'selected', 'checked', 'open', 'closed', 'valid', 'invalid',
      'readonly', 'editable', 'hidden', 'shown', 'loading', 'loaded',
      'required', 'optional', 'focused', 'blurred', 'collapsed'
    ]
    
    const seemsLikeBoolean = booleanIndicators.some(indicator => 
      lowerPropName.includes(indicator) || 
      lowerPropName.startsWith('is') || 
      lowerPropName.startsWith('has') || 
      lowerPropName.startsWith('can') ||
      lowerPropName.startsWith('should') ||
      lowerPropName.startsWith('will')
    )
    
    if (seemsLikeBoolean) {
      // For hidden nodes with boolean-like property names, use heuristics
      // Check if this is a singleton node (no outgoing edges, low ID)
      const nodeIndex = Math.floor(targetNode.id / nodeFields.length)
      const nodeEdges = getNodeEdges(nodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)
      
      // Boolean singleton objects typically have no outgoing edges or very few
      if (nodeEdges.length === 0 && targetNode.id < 200) {
        // Simple heuristic: nodes with ID in certain ranges
        // This is still a heuristic but avoids hardcoding specific IDs
        // In many V8 versions, small odd IDs tend to be true, even IDs false
        // But we'll be more conservative and only handle clear cases
        if (targetNode.selfSize === 0 || targetNode.selfSize <= 24) {
          // Very small or zero size suggests a primitive singleton
          // Without more context, we can't reliably determine true vs false
          // We could potentially compare with other similar nodes in the snapshot
          return null // For now, return null until we have better detection
        }
      }
    }
  }

  // Additional check: look for patterns in the edges that reference this node
  // If multiple properties with boolean-like names reference the same few hidden nodes,
  // those are likely the boolean singletons
  // This would require scanning the entire snapshot which is expensive,
  // so we'll skip this for now and rely on the property name context above

  return null
}
