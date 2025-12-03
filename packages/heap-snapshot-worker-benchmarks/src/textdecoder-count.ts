import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testTextDecoderCount = async (): Promise<void> => {
  const { getTextDecoderCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'parts/GetTextDecoderCountFromHeapSnapshot/GetTextDecoderCountFromHeapSnapshot.ts',
  )
  console.log('Testing TextDecoder Count:')

  try {
    const count = await getTextDecoderCountFromHeapSnapshot(filePath1)
    console.log({ count })
    console.log('Expected: 7')
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testTextDecoderCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
