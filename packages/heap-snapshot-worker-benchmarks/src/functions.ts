import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = `/home/simon/Documents/vue-memory-leak/heap-snapshot-react-todo-1.heapsnapshot`
const filePath2 = `/home/simon/Documents/vue-memory-leak/heap-snapshot-react-todo-2.heapsnapshot`

// const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')
// const filePath2 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/1.json')
const resultPath = join(import.meta.dirname, '../snapshots', 'functions.json')

const testFunctionCount = async (): Promise<void> => {
  const { compareHeapSnapshotFunctions2 } = await importHeapSnapshotWorker(
    'src/parts/CompareHeapSnapshotsFunctions2/CompareHeapSnapshotsFunctions2.ts',
  )
  console.log('Testing Function Count:')
  const count = await compareHeapSnapshotFunctions2(filePath1, filePath2, {
    minCount: 3,
    excludeOriginalPaths: [
      // 'functional.ts',
      // 'lifecycle.ts',
      // 'event.ts',
      // 'numbers.ts',
      // 'ternarySearchTree.ts',
      // 'lazy.ts',
      // 'undoRedoService.ts',
      // 'editStack.ts',
    ],
  })
  console.log(count.length)
  await mkdir(dirname(resultPath), { recursive: true })
  await writeFile(resultPath, JSON.stringify(count, null, 2) + '\n')
}

const main = async (): Promise<void> => {
  try {
    await testFunctionCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
