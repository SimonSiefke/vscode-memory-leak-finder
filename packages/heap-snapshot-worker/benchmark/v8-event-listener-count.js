import { join } from 'node:path'
import { getV8EventListenerCountFromHeapSnapshot } from '../src/parts/GetV8EventListenerCountFromHeapSnapshot/GetV8EventListenerCountFromHeapSnapshot.js'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testV8EventListenerCount = async () => {
  console.log('Testing V8EventListener Count:')

  try {
    const count = await getV8EventListenerCountFromHeapSnapshot(filePath1)
    console.log({ count })

  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testV8EventListenerCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
