import { join } from 'node:path'
import { getWorkerCountFromHeapSnapshot } from '../src/parts/GetWorkerCountFromHeapSnapshot/GetWorkerCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testWorkerCount = async () => {
  console.log('Testing Worker Count:')

  try {
    const count = await getWorkerCountFromHeapSnapshot(filePath1)
    console.log({ count })
    console.log('Expected: 3')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testWorkerCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
