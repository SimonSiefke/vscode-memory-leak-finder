import { join } from 'node:path'
import { getTextDecoderCountFromHeapSnapshot } from '../src/parts/GetTextDecoderCountFromHeapSnapshot/GetTextDecoderCountFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testTextDecoderCount = async () => {
  console.log('Testing TextDecoder Count:')

  try {
    const count = await getTextDecoderCountFromHeapSnapshot(filePath1)
    console.log({ count })
    console.log('Expected: 7')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testTextDecoderCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
