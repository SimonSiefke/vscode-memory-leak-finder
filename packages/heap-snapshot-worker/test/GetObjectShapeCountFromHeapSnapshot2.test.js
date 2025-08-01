import { expect, test } from '@jest/globals'
import { getObjectShapeCountFromHeapSnapshot2 } from '../src/parts/GetObjectShapeCountFromHeapSnapshot2/GetObjectShapeCountFromHeapSnapshot2.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('getObjectShapeCountFromHeapSnapshot2 - should count object shapes from heap snapshot file', async () => {
  const path = join(__dirname, '../../.vscode-heapsnapshots', '1.json')

  try {
    const count = await getObjectShapeCountFromHeapSnapshot2(path)
    expect(typeof count).toBe('number')
    expect(count).toBeGreaterThanOrEqual(0)
    console.log(`Found ${count} object shapes in heap snapshot`)
  } catch (error) {
    // If the file doesn't exist, skip the test
    if (error.code === 'ENOENT') {
      console.log('Heap snapshot file not found, skipping test')
      return
    }
    throw error
  }
})