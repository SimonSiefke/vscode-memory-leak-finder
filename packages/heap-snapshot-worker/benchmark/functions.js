import { join } from 'node:path'
import { compareHeapSnapshotFunctions2 } from '../src/parts/CompareHeapSnapshotsFunctions2/CompareHeapSnapshotsFunctions2.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/1.json')

const testFunctionCount = async () => {
  console.log('Testing Function Count:')

  try {
    const count = await compareHeapSnapshotFunctions2(filePath1, filePath2)
    console.log(count.length)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testFunctionCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
