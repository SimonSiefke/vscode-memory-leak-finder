import { test, expect } from '@jest/globals'
import { getMapCountFromHeapSnapshot } from '../src/parts/GetMapCountFromHeapSnapshot/GetMapCountFromHeapSnapshot.js'

test.skip('getMapCountFromHeapSnapshot should return 1666 for 0.json snapshot', async () => {
  const count = await getMapCountFromHeapSnapshot('/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json')
  expect(count).toBe(1666)
})
