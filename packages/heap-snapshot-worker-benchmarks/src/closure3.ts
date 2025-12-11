import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const { compareNamedClosureCountWithReferencesFromHeapSnapshot2 } = await importHeapSnapshotWorker(
  'src/parts/CompareNamedClosureCountWithReferences2/CompareNamedClosureCountWithReferences2.ts',
)

const filePath1 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/1.json')
const scriptMapPath = join(import.meta.dirname, ' ../../../../../.vscode-script-maps/1.json')
const resultPath = join(import.meta.dirname, '../snapshots', 'result.json')

const testOptimized = async () => {
  try {
    console.time('compare')
    const values = await compareNamedClosureCountWithReferencesFromHeapSnapshot2(filePath1, filePath2, scriptMapPath, {
      minCount: 97,
      excludeOriginalPaths: [
        'async.ts',
        'editStack.ts',
        'event.ts',
        'files.ts',
        'functional.ts',
        'lazy.ts',
        'lifecycle.ts',
        'linkedList.ts',
        'numbers.ts',
        'ternarySearchTree.ts',
        'undoRedoService.ts',
        'uri.ts',
        'debugName.ts',
      ].map((item) => item.replace('.ts', '.js')),
    })
    console.timeEnd('compare')
    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(values, null, 2) + '\n')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testOptimized()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
