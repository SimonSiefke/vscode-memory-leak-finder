import { join } from 'node:path'
import { displayHeapSnapshotFunctions } from '../src/parts/DisplayFunctions/DisplayFunctions.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/abc2.heapsnapshot')

const testFunctionCount = async () => {
  console.log('Testing Function Count:')

  try {
    const snapshot = await prepareHeapSnapshot(filePath1, {
      parseStrings: true,
    })
    const count = await displayHeapSnapshotFunctions(snapshot)
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
