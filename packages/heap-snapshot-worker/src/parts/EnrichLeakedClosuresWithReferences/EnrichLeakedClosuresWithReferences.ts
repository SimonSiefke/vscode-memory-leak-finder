import { readFile } from 'node:fs/promises'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'

export interface LeakedClosureWithReferences {
  readonly nodeName: string
  readonly references: readonly {
    readonly sourceNodeName: string | null
    readonly sourceNodeType: string | null
    readonly edgeType: string
    readonly edgeName: string
    readonly path: string
    readonly count: number
  }[]
  readonly count: number
}

export const enrichLeakedClosuresWithReferences = async (
  leakedClosures: Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>,
  snapshot: Snapshot,
  scriptMapPath?: string,
): Promise<Record<string, readonly LeakedClosureWithReferences[]>> => {
  const { nodes, edges, strings, meta } = snapshot
  const { node_fields, edge_fields, node_types, edge_types } = meta

  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')

  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  const edgeTypeNames = edge_types[0] || []

  // Load script map if provided
  let scriptMap: Record<string, { url?: string; sourceMapUrl?: string }> = {}
  if (scriptMapPath) {
    try {
      const content = await readFile(scriptMapPath, 'utf8')
      scriptMap = JSON.parse(content) as Record<string, { url?: string; sourceMapUrl?: string }>
    } catch {
      // Ignore if file not found or invalid
    }
  }

  // Excluded node names that should be filtered out
  const excludedNodeNames = new Set<string>(['(object elements)', 'system / Context', 'system / WeakFixedArray', 'system / WeakCell'])

  // Excluded edge patterns: edgeType + sourceNodeName combinations
  const excludedEdgePatterns = new Set<string>(['internal:system / Context'])

  // Excluded type patterns: edgeType + sourceNodeType combinations
  const excludedTypePatterns = new Set<string>(['internal:array'])

  // Step 1: Collect all leaked node byte offsets into a Set for O(1) lookup
  const leakedNodeByteOffsets = new Set<number>()
  for (const closures of Object.values(leakedClosures)) {
    for (const closure of closures) {
      // nodeIndex is already a byte offset
      leakedNodeByteOffsets.add(closure.nodeIndex)
    }
  }

  // Step 2: Create a map from node byte offset to references array
  const referencesMap = new Map<
    number,
    Array<{
      readonly sourceNodeName: string | null
      readonly sourceNodeType: string | null
      readonly edgeType: string
      readonly edgeName: string
      readonly path: string
    }>
  >()

  // Initialize empty arrays for all leaked nodes
  for (const byteOffset of leakedNodeByteOffsets) {
    referencesMap.set(byteOffset, [])
  }

  // Step 3: Loop through all nodes once
  let currentEdgeOffset = 0
  for (let sourceNodeIndex = 0; sourceNodeIndex < nodes.length; sourceNodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[sourceNodeIndex + edgeCountFieldIndex]

    // Step 4: For each edge, check if it points to a leaked node
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if this edge points to a leaked node
      if (leakedNodeByteOffsets.has(edgeToNode)) {
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeTypeName = edgeTypeNames[edgeType] || `type_${edgeType}`

        const sourceNode = parseNode(sourceNodeIndex / ITEMS_PER_NODE, nodes, node_fields)
        if (!sourceNode) {
          continue
        }

        const sourceNodeId = sourceNode.id
        const sourceNodeName = getNodeName(sourceNode, strings)
        const sourceNodeType = getNodeTypeName(sourceNode, node_types)

        let edgeName = ''
        let path = ''

        if (edgeTypeName === 'property') {
          edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
          if (sourceNodeName) {
            path = `${sourceNodeName}.${edgeName}`
          } else {
            path = `[Object ${sourceNodeId}].${edgeName}`
          }
        } else if (edgeTypeName === 'element') {
          edgeName = `[${edgeNameOrIndex}]`
          if (sourceNodeName) {
            path = `${sourceNodeName}${edgeName}`
          } else {
            path = `[Array ${sourceNodeId}]${edgeName}`
          }
        } else if (edgeTypeName === 'context') {
          edgeName = 'context'
          if (sourceNodeName) {
            path = `${sourceNodeName}.context`
          } else {
            path = `[Closure ${sourceNodeId}].context`
          }
        } else if (edgeTypeName === 'internal') {
          edgeName = 'internal'
          if (sourceNodeName) {
            path = `${sourceNodeName}.internal`
          } else {
            path = `[${sourceNodeType} ${sourceNodeId}].internal`
          }
        } else {
          edgeName = edgeTypeName
          if (sourceNodeName) {
            path = `${sourceNodeName}.${edgeTypeName}`
          } else {
            path = `[${sourceNodeType} ${sourceNodeId}].${edgeTypeName}`
          }
        }

        // Step 5: Filter out unimportant edges/references
        // Filter out excluded node names
        if (sourceNodeName && excludedNodeNames.has(sourceNodeName)) {
          continue
        }
        // Filter out excluded edge patterns (edgeType:sourceNodeName)
        if (sourceNodeName) {
          const edgePattern = `${edgeTypeName}:${sourceNodeName}`
          if (excludedEdgePatterns.has(edgePattern)) {
            continue
          }
        }
        // Filter out excluded type patterns (edgeType:sourceNodeType)
        if (sourceNodeType) {
          const typePattern = `${edgeTypeName}:${sourceNodeType}`
          if (excludedTypePatterns.has(typePattern)) {
            continue
          }
        }

        // Step 6: Add the reference to the appropriate array
        const references = referencesMap.get(edgeToNode)
        if (references) {
          references.push({
            sourceNodeName,
            sourceNodeType,
            edgeType: edgeTypeName,
            edgeName,
            path,
          })
        }
      }
    }

    currentEdgeOffset += edgeCount
  }

  // Step 7: Map the closures to include their references
  const enriched: Record<string, LeakedClosureWithReferences[]> = {}
  for (const [locationKey, closures] of Object.entries(leakedClosures)) {
    enriched[locationKey] = closures.map((closure) => {
      const references = referencesMap.get(closure.nodeIndex) || []
      const sortedReferences = [...references].sort((a, b) => {
        // Sort by sourceNodeName first
        const sourceNodeNameA = a.sourceNodeName ?? ''
        const sourceNodeNameB = b.sourceNodeName ?? ''
        if (sourceNodeNameA !== sourceNodeNameB) {
          return sourceNodeNameA.localeCompare(sourceNodeNameB)
        }
        // Then sort by path
        return a.path.localeCompare(b.path)
      })

      // Step 8: Deduplicate references and add count
      const deduplicatedMap = new Map<
        string,
        {
          sourceNodeName: string | null
          sourceNodeType: string | null
          edgeType: string
          edgeName: string
          path: string
          count: number
        }
      >()

      for (const ref of sortedReferences) {
        // Create a unique key based on all properties
        const key = `${ref.sourceNodeName ?? ''}:${ref.sourceNodeType ?? ''}:${ref.edgeType}:${ref.edgeName}:${ref.path}`
        const existing = deduplicatedMap.get(key)
        if (existing) {
          existing.count++
        } else {
          deduplicatedMap.set(key, {
            sourceNodeName: ref.sourceNodeName,
            sourceNodeType: ref.sourceNodeType,
            edgeType: ref.edgeType,
            edgeName: ref.edgeName,
            path: ref.path,
            count: 1,
          })
        }
      }

      const deduplicatedReferences = Array.from(deduplicatedMap.values())

      return {
        nodeName: closure.nodeName,
        references: deduplicatedReferences,
        count: 1,
      }
    })
  }

  // Step 9: Deduplicate outer closure items by nodeName and references
  const finalEnriched: Record<string, readonly LeakedClosureWithReferences[]> = {}
  for (const [locationKey, closures] of Object.entries(enriched)) {
    const deduplicatedMap = new Map<
      string,
      {
        nodeName: string
        references: readonly {
          sourceNodeName: string | null
          sourceNodeType: string | null
          edgeType: string
          edgeName: string
          path: string
          count: number
        }[]
        count: number
      }
    >()

    for (const closure of closures) {
      // Create a unique key based on nodeName and serialized references
      const referencesKey = JSON.stringify(closure.references)
      const key = `${closure.nodeName}:${referencesKey}`
      const existing = deduplicatedMap.get(key)
      if (existing) {
        existing.count++
      } else {
        deduplicatedMap.set(key, {
          nodeName: closure.nodeName,
          references: closure.references,
          count: 1,
        })
      }
    }

    finalEnriched[locationKey] = Array.from(deduplicatedMap.values())
  }

  // Step 10: Replace script IDs in keys with URLs from script map
  const result: Record<string, readonly LeakedClosureWithReferences[]> = {}
  for (const [locationKey, closures] of Object.entries(finalEnriched)) {
    // Parse location key (format: "scriptId:line:column")
    const parts = locationKey.split(':')
    if (parts.length === 3) {
      const scriptId = parts[0]
      const line = parts[1]
      const column = parts[2]
      const script = scriptMap[scriptId]
      if (script?.url) {
        // Replace script ID with URL
        const newKey = `${script.url}:${line}:${column}`
        result[newKey] = closures
      } else {
        // Keep original key if no URL found
        result[locationKey] = closures
      }
    } else {
      // Keep original key if format doesn't match
      result[locationKey] = closures
    }
  }

  return result
}
