import { join } from 'node:path'
import { getFunctionCountFromHeapSnapshot } from '../src/parts/GetFunctionCountFromHeapSnapshot/GetFunctionCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')

const testFunctionCount = async () => {
  console.log('Testing Function Count:')

  try {
    const count = await getFunctionCountFromHeapSnapshot(filePath1)
    console.log({ count })
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
