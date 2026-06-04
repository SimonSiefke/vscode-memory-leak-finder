import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/1.json')
const resultPath = join(import.meta.dirname, '../snapshots', 'result.json')

const testFunctionCount = async (): Promise<void> => {
  console.log('Testing Function Count:')

  try {
    const { compareHeapSnapshotFunctions2 } = await importHeapSnapshotWorker(
      'src/parts/CompareHeapSnapshotsFunctions2/CompareHeapSnapshotsFunctions2.ts',
    )
    const result = await compareHeapSnapshotFunctions2(filePath1, filePath2, {
      minCount: 1,
    })

    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(result, null, 2) + '\n')

    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
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
