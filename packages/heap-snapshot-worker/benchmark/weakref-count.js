import { join } from 'node:path'
import { getWeakRefCountFromHeapSnapshot } from '../src/parts/GetWeakRefCountFromHeapSnapshot/GetWeakRefCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWeakRefCount = async () => {
  console.log('Testing WeakRef Count:')

  try {
    const count = await getWeakRefCountFromHeapSnapshot(filePath1)
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
