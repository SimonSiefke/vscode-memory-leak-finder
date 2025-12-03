import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testPromiseCount = async (): Promise<void> => {
  const { getPromiseCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'parts/GetPromiseCountFromHeapSnapshot/GetPromiseCountFromHeapSnapshot.ts',
  )
  console.log('Testing Promise Count:')

  const count = await getPromiseCountFromHeapSnapshot(filePath1)
  console.log({ count })
}

const main = async (): Promise<void> => {
  try {
    await testPromiseCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
