// import { writeFile } from 'node:fs/promises'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

async function testGetObjectsWithProperties(): Promise<void> {
  const [{ getObjectsWithPropertiesInternal }, { prepareHeapSnapshot }, Timing] = await Promise.all([
    importHeapSnapshotWorker('parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'),
    importHeapSnapshotWorker('parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'),
    importHeapSnapshotWorker('parts/Timing/Timing.ts'),
  ])

  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  // const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.heapsnapshot'
  // const resultPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/objects-with-properties.json'
  const property = 'dispose'
  const depth = 1

  try {
    // Prepare the heap snapshot
    console.time('prepare')
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })
    console.timeEnd('prepare')

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    console.log('\n=== Testing Refactored Function ===')
    console.time('check')
    const oldStateObjects = getObjectsWithPropertiesInternal(snapshot, property, depth)
    console.timeEnd('check')
    console.log(`Refactored function found ${oldStateObjects.length} objects with "oldState" property`)

    Timing.report('getObjectsWithPropertiesInternal breakdown')

    // console.log(JSON.stringify({ oldStateObjects }, null, 2))
    // await writeFile(resultPath, JSON.stringify(oldStateObjects, null, 2) + '\n')
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
