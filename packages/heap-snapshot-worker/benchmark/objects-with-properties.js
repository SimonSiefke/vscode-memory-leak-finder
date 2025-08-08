import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.json'

  try {
    // Prepare the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    const abcdefObjects = getObjectsWithPropertiesInternal(snapshot, 'abcdef')

    console.log(`Found ${abcdefObjects.length} objects with "abcdef" property:`)
    abcdefObjects.forEach((obj, index) => {
      console.log(`  Object ${index + 1}:`)
      console.log(`    ID: ${obj.id}`)
      console.log(`    Name: ${obj.name}`)
      console.log(`    Property Value: ${obj.propertyValue}`)
      console.log(`    Type: ${obj.type}`)
      console.log(`    Self Size: ${obj.selfSize}`)
      console.log(`    Edge Count: ${obj.edgeCount}`)
    })
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
