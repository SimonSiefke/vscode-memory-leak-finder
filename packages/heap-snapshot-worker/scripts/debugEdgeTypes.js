import * as LoadHeapSnapshot from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as ParseHeapSnapshot from '../src/parts/ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

const debugEdgeTypes = async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'

  console.log('Loading heap snapshot...')
  await LoadHeapSnapshot.loadHeapSnapshot(heapSnapshotPath)
  const heapsnapshot = HeapSnapshotState.get(heapSnapshotPath)

  console.log('\n=== HEAP SNAPSHOT METADATA ===')
  console.log('Edge types:', heapsnapshot.snapshot.meta.edge_types[0])
  console.log('Edge fields:', heapsnapshot.snapshot.meta.edge_fields)
  console.log('Node types:', heapsnapshot.snapshot.meta.node_types[0])
  console.log('Node fields:', heapsnapshot.snapshot.meta.node_fields)

  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)

  // Find an object named "Hsi" to debug
  const hsiObject = parsedNodes.find(node => node.name === 'Hsi' && node.type === 'object')

  if (hsiObject) {
    console.log('\n=== DEBUGGING HSI OBJECT ===')
    console.log('Hsi object:', hsiObject)

    const edges = graph[hsiObject.id] || []
    console.log(`\nHsi object has ${edges.length} edges:`)

    // Group edges by type to understand the structure
    const edgesByType = {}
    edges.forEach(edge => {
      if (!edgesByType[edge.type]) {
        edgesByType[edge.type] = []
      }
      edgesByType[edge.type].push(edge)
    })

    console.log('\nEdges grouped by type:')
    Object.entries(edgesByType).forEach(([type, typeEdges]) => {
      console.log(`  ${type || 'undefined'}: ${typeEdges.length} edges`)
      if (typeEdges.length < 10) { // Show details for small groups
        typeEdges.forEach((edge, i) => {
          console.log(`    ${i}: name="${edge.name}", index=${edge.index}`)
        })
      }
    })

    // Look specifically for prototype-related edges
    const prototypeEdges = edges.filter(edge =>
      edge.name === '__proto__' ||
      edge.name === 'prototype' ||
      edge.type === 'internal'
    )

    console.log(`\nPrototype-related edges: ${prototypeEdges.length}`)
    prototypeEdges.forEach((edge, i) => {
      console.log(`  ${i}: type="${edge.type}", name="${edge.name}", index=${edge.index}`)

      // Try to resolve the target node
      const nodeMap = new Map()
      parsedNodes.forEach(node => nodeMap.set(node.id, node))

      const targetNode = nodeMap.get(edge.index)
      if (targetNode) {
        console.log(`    → Points to: ${targetNode.type} "${targetNode.name}" (ID: ${targetNode.id})`)
      } else {
        console.log(`    → Could not resolve target node ${edge.index}`)
      }
    })
  }

  // Let's also examine a few different object types
  console.log('\n=== SAMPLE OBJECTS AND THEIR EDGES ===')
  const sampleObjects = parsedNodes.filter(node => node.type === 'object').slice(0, 3)

  sampleObjects.forEach((obj, i) => {
    console.log(`\nSample object ${i}: ${obj.type} "${obj.name}" (ID: ${obj.id})`)
    const edges = graph[obj.id] || []

    // Look for __proto__ specifically
    const protoEdge = edges.find(edge => edge.name === '__proto__')
    if (protoEdge) {
      console.log(`  Has __proto__ edge: type="${protoEdge.type}", index=${protoEdge.index}`)

      // What does it point to?
      const nodeMap = new Map()
      parsedNodes.forEach(node => nodeMap.set(node.id, node))
      const target = nodeMap.get(protoEdge.index)

      if (target) {
        console.log(`  __proto__ points to: ${target.type} "${target.name}"`)
      }
    } else {
      console.log('  No __proto__ edge found')
    }
  })

  // Clean up
  HeapSnapshotState.dispose(heapSnapshotPath)
}

debugEdgeTypes().catch(console.error)