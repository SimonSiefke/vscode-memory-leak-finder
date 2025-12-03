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
  // console.log(`\n=== Testing Optimized Named Function Count for: ${filePath} ===`)

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
      ].map((item) => item.replace('.ts', '.js')),
    })
    console.timeEnd('compare')
    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(values, null, 2) + '\n')

    // console.log(`  Duration: ${duration.toFixed(2)}ms`)
    // console.log(`  Functions found: ${result.length / 5}`)

    // if (result.length > 0) {
    //   console.log(`  Top 5 functions:`)
    //   for (let i = 0; i < Math.min(5, result.length / 5); i++) {
    //     const arrayIndex = i * 4
    //     const scriptIdIndex = result[arrayIndex]
    //     const lineIndex = result[arrayIndex + 1]
    //     const columnIndex = result[arrayIndex + 2]
    //     const count = result[arrayIndex + 3]
    //     const script = scriptMap[scriptIdIndex]
    //     const url = script?.url || 'unknown'
    //     console.log(`    ${i + 1}. ${url}:${lineIndex}:${columnIndex} (count: ${count})`)
    //   }
    // }

    // return { duration, count: result.length }
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
