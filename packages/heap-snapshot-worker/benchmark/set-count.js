import { join } from 'node:path'
import { getSetCountFromHeapSnapshot } from '../src/parts/GetSetCountFromHeapSnapshot/GetSetCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testSetCount = async () => {
  console.log('Testing Set Count:')

  try {
    const count = await getSetCountFromHeapSnapshot(filePath1)
    console.log({ count })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testSetCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
