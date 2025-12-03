import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testV8EventListenerCount = async (): Promise<void> => {
  const { getV8EventListenerCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'parts/GetV8EventListenerCountFromHeapSnapshot/GetV8EventListenerCountFromHeapSnapshot.ts'
  )
  console.log('Testing V8EventListener Count:')

  try {
    const count = await getV8EventListenerCountFromHeapSnapshot(filePath1)
    console.log({ count })
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testV8EventListenerCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
