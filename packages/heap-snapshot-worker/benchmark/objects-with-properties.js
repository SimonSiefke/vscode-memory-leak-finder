import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'

  try {
    // Prepare the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    console.log('\n=== Testing Refactored Function ===')
    console.time('check')
    const oldStateObjects = getObjectsWithPropertiesInternal(snapshot, 'oldState', 3)
    console.timeEnd('check')
    console.log(`Refactored function found ${oldStateObjects.length} objects with "oldState" property`)

    console.log(JSON.stringify({ oldStateObjects }, null, 2))
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
