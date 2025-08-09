import { test, expect } from '@jest/globals'
import { examineNodeById } from '../src/parts/ExamineNode/ExamineNode.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

test('analyze node ID 67 from abc2.heapsnapshot', async () => {
  try {
    const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'

    // Check if file exists first
    const fs = await import('node:fs/promises')
    try {
      await fs.access(heapSnapshotPath)
    } catch {
      console.log(`Heap snapshot file not found at: ${heapSnapshotPath}`)
      console.log('Please ensure the file exists at that location')
      return
    }

    // Load the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, { parseStrings: true })

    // Examine node with ID 67
    const result = examineNodeById(67, snapshot)

    if (!result) {
      console.log('Node with ID 67 not found in heap snapshot')
      return
    }

    console.log('=== NODE ID 67 ANALYSIS ===')
    console.log(`Node Index: ${result.nodeIndex}`)
    console.log(`Node ID: ${result.nodeId}`)
    console.log(`Node Name: ${result.nodeName}`)
    console.log(`Node Type: ${result.nodeType}`)
    console.log(`Self Size: ${result.node.self_size}`)
    console.log(`Edge Count: ${result.node.edge_count}`)
    console.log(`Detachedness: ${result.node.detachedness}`)

    console.log('\n=== EDGES ===')
    result.edges.forEach((edge, index) => {
      console.log(`Edge ${index}:`)
      console.log(`  Type: ${edge.typeName} (${edge.type})`)
      console.log(`  Name: ${edge.edgeName}`)
      console.log(`  To Node: ${edge.toNode}`)
      if (edge.targetNodeInfo) {
        console.log(`  Target: ${edge.targetNodeInfo.type} "${edge.targetNodeInfo.name}"`)
      }
    })

    console.log('\n=== PROPERTIES ===')
    if (result.properties.length === 0) {
      console.log('No properties found')
    } else {
      result.properties.forEach((prop, index) => {
        const valueDisplay = prop.value?.startsWith('[undefined ') ? `**${prop.value}**` : prop.value
        console.log(`Property ${index}: ${prop.name} = ${valueDisplay} (${prop.targetType})`)
      })
    }

    // Check if this could be an undefined value
    if (result.nodeName === 'undefined' || result.nodeType === 'undefined') {
      console.log('\n*** This appears to be an undefined value! ***')
    }

    // Additional analysis for object properties
    console.log('\n=== DETAILED EDGE ANALYSIS ===')
    const propertyEdges = result.edges.filter((edge) => edge.typeName === 'property')
    const internalEdges = result.edges.filter((edge) => edge.typeName === 'internal')
    const contextEdges = result.edges.filter((edge) => edge.typeName === 'context')
    const elementEdges = result.edges.filter((edge) => edge.typeName === 'element')

    console.log(`Property edges: ${propertyEdges.length}`)
    console.log(`Internal edges: ${internalEdges.length}`)
    console.log(`Context edges: ${contextEdges.length}`)
    console.log(`Element edges: ${elementEdges.length}`)

    expect(result).toBeDefined()
    expect(result.nodeId).toBe(67)
  } catch (error) {
    console.error('Error analyzing node 67:', error)
    throw error
  }
})

test('search for undefined nodes in abc2.heapsnapshot', async () => {
  try {
    const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'

    // Check if file exists first
    const fs = await import('node:fs/promises')
    try {
      await fs.access(heapSnapshotPath)
    } catch {
      console.log(`Heap snapshot file not found at: ${heapSnapshotPath}`)
      console.log('Skipping undefined nodes search')
      return
    }

    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, { parseStrings: true })

    console.log('\n=== SEARCHING FOR UNDEFINED NODES ===')
    const { nodes, strings, meta } = snapshot
    const { node_fields, node_types } = meta
    const ITEMS_PER_NODE = node_fields.length
    const nameFieldIndex = node_fields.indexOf('name')
    const typeFieldIndex = node_fields.indexOf('type')
    const idFieldIndex = node_fields.indexOf('id')

    // Find the string index for "undefined"
    const undefinedStringIndex = strings.findIndex((str) => str === 'undefined')
    console.log(`"undefined" string index: ${undefinedStringIndex}`)

    if (undefinedStringIndex !== -1) {
      // Find all nodes with name "undefined"
      const undefinedNodes: Array<{ nodeIndex: number; id: number; typeName: string }> = []
      for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
        const nameIndex = nodes[i + nameFieldIndex]
        const nodeId = nodes[i + idFieldIndex]
        const typeIndex = nodes[i + typeFieldIndex]

        if (nameIndex === undefinedStringIndex) {
          const typeName = node_types[0] ? node_types[0][typeIndex] : 'unknown'
          undefinedNodes.push({
            nodeIndex: i / ITEMS_PER_NODE,
            id: nodeId,
            typeName,
          })
        }
      }

      console.log(`Found ${undefinedNodes.length} nodes with name "undefined":`)
      undefinedNodes.forEach((node) => {
        console.log(`  Node ID ${node.id} (index ${node.nodeIndex}): ${node.typeName}`)
      })

      // Check if node 67 is among them
      const node67 = undefinedNodes.find((node) => node.id === 67)
      if (node67) {
        console.log('\n*** NODE 67 IS AN UNDEFINED VALUE! ***')
      }
    }
  } catch (error) {
    console.error('Error searching for undefined nodes:', error)
    throw error
  }
})
