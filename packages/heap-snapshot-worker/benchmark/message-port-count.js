import { join } from 'node:path'
import { getMessagePortCountFromHeapSnapshot } from '../src/parts/GetMessagePortCountFromHeapSnapshot/GetMessagePortCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWeakRefCount = async () => {
  console.log('Testing MessagePort Count:')

  try {
    const count = await getMessagePortCountFromHeapSnapshot(filePath1)
    console.log({ count })
    console.log('Expected: 6')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testWeakRefCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
