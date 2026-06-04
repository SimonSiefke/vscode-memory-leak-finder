import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/1.json')

const testPromiseCount = async (): Promise<void> => {
  const { getPromiseCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'src/parts/GetPromiseCountFromHeapSnapshot/GetPromiseCountFromHeapSnapshot.ts',
  )
  console.log('Testing Promise Count:')

  const count = await getPromiseCountFromHeapSnapshot(filePath1)
  const count2 = await getPromiseCountFromHeapSnapshot(filePath2)
  console.log({ count, count2 })
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
