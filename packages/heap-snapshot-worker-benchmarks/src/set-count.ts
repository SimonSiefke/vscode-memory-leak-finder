import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testSetCount = async (): Promise<void> => {
  const { getSetCountFromHeapSnapshot } = await importHeapSnapshotWorker('parts/GetSetCountFromHeapSnapshot/GetSetCountFromHeapSnapshot.ts')
  console.log('Testing Set Count:')

  try {
    const count = await getSetCountFromHeapSnapshot(filePath1)
    console.log({ count })
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testSetCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
