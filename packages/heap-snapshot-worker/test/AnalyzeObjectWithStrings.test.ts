import { test } from '@jest/globals'
import { examineNodeById } from '../src/parts/ExamineNode/ExamineNode.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

test('analyze object with string properties including empty strings', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'

  try {
    // Check if file exists first
    const fs = await import('node:fs/promises')
    try {
      await fs.access(heapSnapshotPath)
    } catch {
      console.log(`Heap snapshot file not found at: ${heapSnapshotPath}`)
      console.log('Skipping object string analysis')
      return
    }

    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, { parseStrings: true })

    console.log('\n=== SEARCHING FOR OBJECTS WITH STRING PROPERTIES ===')
    const { nodes, edges, strings, meta } = snapshot
    const { node_fields, node_types, edge_fields, edge_types } = meta
    const ITEMS_PER_NODE = node_fields.length
    const ITEMS_PER_EDGE = edge_fields.length

    const typeFieldIndex = node_fields.indexOf('type')
    const idFieldIndex = node_fields.indexOf('id')
    const edgeCountFieldIndex = node_fields.indexOf('edge_count')

    const edgeTypeFieldIndex = edge_fields.indexOf('type')
    const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
    const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

    const objectTypeIndex = node_types[0]?.indexOf('object')
    const stringTypeIndex = node_types[0]?.indexOf('string')
    const propertyEdgeTypeIndex = edge_types[0]?.indexOf('property')

    if (objectTypeIndex === -1 || stringTypeIndex === -1 || propertyEdgeTypeIndex === -1) {
      console.log('Required types not found in snapshot')
      return
    }

    // Find objects that have string properties
    const objectsWithStringProps: Array<{
      nodeId: number
      nodeIndex: number
      stringProperties: Array<{ propertyName: string; targetNodeId: number; targetNodeIndex: number }>
    }> = []
    let currentEdgeOffset = 0

    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
      const typeIndex = nodes[nodeIndex + typeFieldIndex]
      const nodeId = nodes[nodeIndex + idFieldIndex]
      const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]

      if (typeIndex === objectTypeIndex) {
        // Check this object's edges for string properties
        const stringProperties: Array<{ propertyName: string; targetNodeId: number; targetNodeIndex: number }> = []

        for (let j = 0; j < edgeCount; j++) {
          const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
          const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
          const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]
          const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]

          if (edgeType === propertyEdgeTypeIndex) {
            // Get target node info
            const targetNodeIndex = Math.floor(edgeToNode / ITEMS_PER_NODE)
            if (targetNodeIndex * ITEMS_PER_NODE < nodes.length) {
              const targetTypeIndex = nodes[targetNodeIndex * ITEMS_PER_NODE + typeFieldIndex]

              if (targetTypeIndex === stringTypeIndex) {
                const propertyName = strings[edgeNameIndex] || `<unknown_${edgeNameIndex}>`
                const targetNodeId = nodes[targetNodeIndex * ITEMS_PER_NODE + idFieldIndex]
                stringProperties.push({
                  propertyName,
                  targetNodeId,
                  targetNodeIndex,
                })
              }
            }
          }
        }

        if (stringProperties.length > 0) {
          objectsWithStringProps.push({
            nodeId,
            nodeIndex: nodeIndex / ITEMS_PER_NODE,
            stringProperties,
          })
        }
      }

      currentEdgeOffset += edgeCount
    }

    console.log(`Found ${objectsWithStringProps.length} objects with string properties`)

    // Analyze a few interesting objects
    const interestingObjects = objectsWithStringProps.slice(0, 3)

    for (const obj of interestingObjects) {
      console.log(`\n--- Object ID ${obj.nodeId} Analysis ---`)

      const result = examineNodeById(obj.nodeId, snapshot)
      if (result) {
        console.log(`Properties (${result.properties.length} total):`)

        // Show string properties specifically
        const stringProps = result.properties.filter((p) => p.targetType === 'string')
        if (stringProps.length > 0) {
          console.log('String properties:')
          stringProps.forEach((prop) => {
            let valueDisplay = prop.value
            if (prop.value === '""') {
              valueDisplay = '🔴 "" (empty string)'
            } else if (prop.value?.startsWith('"') && prop.value.endsWith('"')) {
              valueDisplay = `✅ ${prop.value}`
            } else if (prop.value?.startsWith('[String ')) {
              valueDisplay = `❌ ${prop.value} (BEFORE: would show generic String ID)`
            }
            console.log(`  ${prop.name}: ${valueDisplay}`)
          })
        }

        // Show a few non-string properties for context
        const otherProps = result.properties.filter((p) => p.targetType !== 'string').slice(0, 3)
        if (otherProps.length > 0) {
          console.log('Other properties (sample):')
          otherProps.forEach((prop) => {
            console.log(`  ${prop.name}: ${prop.value} (${prop.targetType})`)
          })
        }
      }

      if (interestingObjects.indexOf(obj) < 2) {
        console.log('') // Add spacing between objects
      }
    }

    // Look specifically for objects with potential empty string properties
    console.log('\n=== LOOKING FOR EMPTY STRING PROPERTIES ===')
    let foundEmptyStrings = false

    for (const obj of objectsWithStringProps.slice(0, 10)) {
      const result = examineNodeById(obj.nodeId, snapshot)
      if (result) {
        const emptyStringProps = result.properties.filter((p) => p.value === '""')
        if (emptyStringProps.length > 0) {
          console.log(`Object ${obj.nodeId} has empty string properties:`)
          emptyStringProps.forEach((prop) => {
            console.log(`  ${prop.name}: ${prop.value}`)
          })
          foundEmptyStrings = true
        }
      }
    }

    if (!foundEmptyStrings) {
      console.log('No empty string properties found in the first 10 objects checked.')
      console.log('This is normal - empty strings are relatively rare in most applications.')
    }
  } catch (error) {
    console.error('Error analyzing objects with strings:', error)
    throw error
  }
})
