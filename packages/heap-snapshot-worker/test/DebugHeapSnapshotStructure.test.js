import { test, expect } from '@jest/globals'
import * as LoadHeapSnapshot from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as ParseHeapSnapshot from '../src/parts/ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

test('debugHeapSnapshotStructure', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'

  // Load the real heap snapshot
  await LoadHeapSnapshot.loadHeapSnapshot(heapSnapshotPath)
  const heapsnapshot = HeapSnapshotState.get(heapSnapshotPath)

  console.log('=== HEAP SNAPSHOT METADATA ===')
  console.log('Node types:', heapsnapshot.snapshot.meta.node_types[0])
  console.log('Node fields:', heapsnapshot.snapshot.meta.node_fields)
  console.log('Edge types:', heapsnapshot.snapshot.meta.edge_types[0])
  console.log('Edge fields:', heapsnapshot.snapshot.meta.edge_fields)

  // Parse the heap snapshot
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)

  console.log('\n=== BASIC STATISTICS ===')
  console.log('Total nodes:', parsedNodes.length)
  console.log('Graph keys:', Object.keys(graph).length)

  // Analyze node types
  const nodeTypeCounts = {}
  parsedNodes.slice(0, 1000).forEach((node) => {
    nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1
  })

  console.log('\n=== NODE TYPE DISTRIBUTION (first 1000) ===')
  Object.entries(nodeTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`)
    })

  // Analyze edge types for a few nodes
  console.log('\n=== SAMPLE EDGE ANALYSIS ===')
  for (let i = 0; i < 10 && i < parsedNodes.length; i++) {
    const node = parsedNodes[i]
    const edges = graph[node.id] || []

    console.log(`Node ${i}: ${node.type} "${node.name}" (ID: ${node.id})`)
    console.log(
      `  Edges (${edges.length}):`,
      edges.slice(0, 5).map((e) => `${e.type}:${e.name}`),
    )

    if (edges.length > 0) {
      // Look for prototype-related edges
      const prototypeEdges = edges.filter(
        (e) => e.name === '__proto__' || e.name === 'prototype' || e.type === 'internal' || e.name.includes('proto'),
      )
      if (prototypeEdges.length > 0) {
        console.log(
          `  Prototype-related edges:`,
          prototypeEdges.map((e) => `${e.type}:${e.name}`),
        )
      }
    }
  }

  // Look for specific edge patterns
  console.log('\n=== EDGE NAME ANALYSIS ===')
  const edgeNames = new Set()
  const edgeTypes = new Set()

  // Sample edges from first 100 nodes to avoid overwhelming output
  for (let i = 0; i < 100 && i < parsedNodes.length; i++) {
    const node = parsedNodes[i]
    const edges = graph[node.id] || []
    edges.forEach((edge) => {
      edgeNames.add(edge.name)
      edgeTypes.add(edge.type)
    })
  }

  console.log('Unique edge types found:', Array.from(edgeTypes).sort())
  console.log('Sample edge names:', Array.from(edgeNames).slice(0, 20).sort())

  // Look specifically for objects and their prototype chains
  console.log('\n=== OBJECT PROTOTYPE ANALYSIS ===')
  const objects = parsedNodes.filter((n) => n.type === 'object').slice(0, 10)
  objects.forEach((obj, i) => {
    const edges = graph[obj.id] || []
    console.log(`Object ${i}: "${obj.name}"`)
    console.log(`  All edges: ${edges.map((e) => `${e.type}:${e.name}`).join(', ')}`)

    // Try to find prototype chain
    const protoEdge = edges.find((e) => e.name === '__proto__' || e.name === 'prototype')
    if (protoEdge) {
      console.log(`  → Found prototype edge: ${protoEdge.type}:${protoEdge.name} → ${protoEdge.to_node}`)
    } else {
      console.log(`  → No prototype edge found`)
    }
  })

  // Clean up
  HeapSnapshotState.dispose(heapSnapshotPath)

  // Basic assertion to ensure test passes
  expect(parsedNodes.length).toBeGreaterThan(0)
}, 30000)
