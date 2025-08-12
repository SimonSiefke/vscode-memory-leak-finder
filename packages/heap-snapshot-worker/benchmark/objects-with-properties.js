import { writeFile } from 'fs/promises'
import { getObjectsWithPropertiesInternalAst } from '../src/parts/GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { printAstRoots } from '../src/parts/PrintAst/PrintAst.ts'
import * as Timing from '../src/parts/Timing/Timing.ts'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  // const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.heapsnapshot'
  const resultPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/objects-with-properties.json'
  const resultAstPath =
    '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/objects-with-properties-ast.json'
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

    console.log('\n=== Testing AST Function ===')
    console.time('check-ast')
    const astObjects = getObjectsWithPropertiesInternalAst(snapshot, property)
    console.timeEnd('check-ast')
    console.log(`AST builder created ${astObjects.length} AST roots for "${property}"`)

    const formatted = printAstRoots(astObjects)
    Timing.report('getObjectsWithPropertiesInternal breakdown')

    await writeFile(resultPath, JSON.stringify(formatted, null, 2) + '\n')
    await writeFile(resultAstPath, JSON.stringify(astObjects, null, 2) + '\n')
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
