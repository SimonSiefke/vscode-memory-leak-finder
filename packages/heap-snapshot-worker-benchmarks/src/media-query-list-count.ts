import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')

const testOptimized = async (): Promise<void> => {
  console.log('Testing Optimized Approach (getMediaQueryListCountFromHeapSnapshot):')

  try {
    const { getMediaQueryListCountFromHeapSnapshot } = await importHeapSnapshotWorker(
      'parts/GetMediaQueryListCountFromHeapSnapshot/GetMediaQueryListCountFromHeapSnapshot.ts',
    )
    const count: number = await getMediaQueryListCountFromHeapSnapshot(filePath1)
    console.log({ count })

    if (count === 7) {
      console.log('✅ Expected count of 7 found!')
    } else {
      console.log(`❌ Expected count of 7, but got ${count}`)
    }
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testOptimized()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
