import * as LoadHeapSnapshot from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as ParseHeapSnapshot from '../src/parts/ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

const debugEdgeParsing = async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'

  await LoadHeapSnapshot.loadHeapSnapshot(heapSnapshotPath)
  const heapsnapshot = HeapSnapshotState.get(heapSnapshotPath)

  console.log('=== HEAP SNAPSHOT METADATA ===')
  console.log('Edge types:', heapsnapshot.snapshot.meta.edge_types[0])
  console.log('Edge fields:', heapsnapshot.snapshot.meta.edge_fields)

  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)

  // Get the first object and examine its edges in detail
  const firstObject = parsedNodes.find(node => node.type === 'object')

  if (firstObject) {
    console.log('\n=== FIRST OBJECT ===')
    console.log('Object:', firstObject)

    const edges = graph[firstObject.id] || []
    console.log(`\nObject has ${edges.length} edges`)

    if (edges.length > 0) {
      console.log('\nFirst 3 edges with all properties:')
      edges.slice(0, 3).forEach((edge, i) => {
        console.log(`Edge ${i}:`)
        console.log('  All properties:', Object.keys(edge))
        console.log('  Values:', edge)
      })

      // Look for the __proto__ edge specifically
      const protoEdge = edges.find(e => e.name === '__proto__')
      if (protoEdge) {
        console.log('\n__proto__ edge details:')
        console.log('  All properties:', Object.keys(protoEdge))
        console.log('  Values:', protoEdge)
      }
    }
  }

  // Also check the raw edge data from the heap snapshot
  console.log('\n=== RAW EDGE DATA SAMPLE ===')
  console.log('First 15 raw edge values:', heapsnapshot.edges.slice(0, 15))
  console.log('Edge fields from metadata:', heapsnapshot.snapshot.meta.edge_fields)
  console.log('Edge types from metadata:', heapsnapshot.snapshot.meta.edge_types[0])

  HeapSnapshotState.dispose(heapSnapshotPath)
}

debugEdgeParsing().catch(console.error)