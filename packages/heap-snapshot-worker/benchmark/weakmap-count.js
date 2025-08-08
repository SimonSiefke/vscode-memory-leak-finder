import { join } from 'node:path'
import { getWeakMapCountFromHeapSnapshot } from '../src/parts/GetWeakMapCountFromHeapSnapshot/GetWeakMapCountFromHeapSnapshot.js'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWeakMapCount = async () => {
  console.log('Testing WeakMap Count:')

  try {
    const count = await getWeakMapCountFromHeapSnapshot(filePath1)
    console.log({ count })

  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testWeakMapCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
