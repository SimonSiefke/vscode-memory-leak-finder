import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWorkerCount = async (): Promise<void> => {
  console.log('Testing Worker Count:')

  try {
    const { getWorkerCountFromHeapSnapshot } = await importHeapSnapshotWorker(
      'parts/GetWorkerCountFromHeapSnapshot/GetWorkerCountFromHeapSnapshot.ts',
    )
    const count = await getWorkerCountFromHeapSnapshot(filePath1)
    console.log({ count })
    console.log('Expected: 3')
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testWorkerCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
