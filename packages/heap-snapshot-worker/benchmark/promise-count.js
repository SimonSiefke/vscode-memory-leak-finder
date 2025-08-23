import { join } from 'node:path'
import { getPromiseCountFromHeapSnapshot } from '../src/parts/GetPromiseCountFromHeapSnapshot/GetPromiseCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testPromiseCount = async () => {
  console.log('Testing Promise Count:')

  const count = await getPromiseCountFromHeapSnapshot(filePath1)
  console.log({ count })
}

const main = async () => {
  try {
    await testPromiseCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
