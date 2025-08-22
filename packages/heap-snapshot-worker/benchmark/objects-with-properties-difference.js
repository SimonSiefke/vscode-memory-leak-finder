import { mkdir, writeFile } from 'fs/promises'
import { getAddedObjectsWithPropertiesInternalAst } from '../src/parts/GetAddedObjectsWithPropertiesInternalAst/GetAddedObjectsWithPropertiesInternalAst.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { dirname, join } from 'path'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  // const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'
  const beforePath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'
  const afterPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'
  const resultPath = join(import.meta.dirname, '..', '.tmp', 'difference.json')
  const property = 'dispose'
  const depth = 1
  const includeProperties = false
  const collapseNodes = true

  try {
    // Prepare the heap snapshot
    console.time('prepare')
    const [snapshot1, snapshot2] = await Promise.all([
      prepareHeapSnapshot(beforePath, {
        parseStrings: true,
      }),
      prepareHeapSnapshot(afterPath, {
        parseStrings: true,
      }),
    ])
    console.timeEnd('prepare')

    console.log('Heap snapshot loaded successfully')

    console.log('\n=== Testing AST Function ===')
    console.time('diff')
    // TODO maybe use worker for property query, since it takes some time
    // TODO the preview would only be needed at the end, meaning much less previews needed instead
    // of creating a preview for all objects

    const difference = getAddedObjectsWithPropertiesInternalAst(snapshot1, snapshot2, property, depth, includeProperties, collapseNodes)
    console.timeEnd('diff')

    console.log({ difference })
    // console.log('count 1', astObjects1.length)
    // console.log('count 2', astObjects2.length)

    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(difference, null, 2) + '\n')
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
