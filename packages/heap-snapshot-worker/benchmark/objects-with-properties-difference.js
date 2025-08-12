import { writeFile } from 'fs/promises'
import { getObjectsWithPropertiesInternalAst } from '../src/parts/GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { printAstRoots } from '../src/parts/PrintAst/PrintAst.ts'
import * as Timing from '../src/parts/Timing/Timing.ts'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  // const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'
  const beforePath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'
  const afterPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'
  const resultPath =
    '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/objects-with-properties-difference.json'
  const property = 'dispose'
  const depth = 1

  try {
    // Prepare the heap snapshot
    console.time('prepare')
    const snapshot1 = await prepareHeapSnapshot(beforePath, {
      parseStrings: true,
    })
    const snapshot2 = await prepareHeapSnapshot(afterPath, {
      parseStrings: true,
    })
    console.timeEnd('prepare')

    console.log('Heap snapshot loaded successfully')

    console.log('\n=== Testing AST Function ===')
    console.time('check-ast')
    // TODO maybe use worker for property query, since it takes some time
    // TODO the preview would only be needed at the end, meaning much less previews needed instead
    // of creating a preview for all objects

    const astObjects1 = getObjectsWithPropertiesInternalAst(snapshot1, property, depth)
    const astObjects2 = getObjectsWithPropertiesInternalAst(snapshot2, property, depth)
    console.timeEnd('check-ast')

    // console.log('count 1', astObjects1.length)
    // console.log('count 2', astObjects2.length)
    const difference = [
      {
        before: astObjects1.length,
        after: astObjects2.length,
      },
    ]

    await writeFile(resultPath, JSON.stringify(difference, null, 2) + '\n')
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
