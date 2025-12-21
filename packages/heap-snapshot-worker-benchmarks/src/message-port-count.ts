import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWeakRefCount = async (): Promise<void> => {
  const { getMessagePortCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'parts/GetMessagePortCountFromHeapSnapshot/GetMessagePortCountFromHeapSnapshot.ts',
  )
  console.log('Testing MessagePort Count:')

  try {
    const count = await getMessagePortCountFromHeapSnapshot(filePath1)
    console.log({ count })
    console.log('Expected: 6')
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testWeakRefCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
