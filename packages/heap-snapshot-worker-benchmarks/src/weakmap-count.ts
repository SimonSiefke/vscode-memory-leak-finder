import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWeakMapCount = async (): Promise<void> => {
  const { getWeakMapCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'parts/GetWeakMapCountFromHeapSnapshot/GetWeakMapCountFromHeapSnapshot.ts'
  )
  console.log('Testing WeakMap Count:')

  try {
    const count = await getWeakMapCountFromHeapSnapshot(filePath1)
    console.log({ count })
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testWeakMapCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
