import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')

const testFunctionCount = async (): Promise<void> => {
  console.log('Testing Function Count:')

  try {
    const { getFunctionCountFromHeapSnapshot } = await importHeapSnapshotWorker(
      'parts/GetFunctionCountFromHeapSnapshot/GetFunctionCountFromHeapSnapshot.ts',
    )
    const count = await getFunctionCountFromHeapSnapshot(filePath1)
    console.log({ count })
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
