import { expect, test } from '@jest/globals'
import { createNameMap } from '../src/parts/CreateNameMap/CreateNameMap.ts'

test('keeps index zero as a display name instead of falling back to Array', () => {
  const nodes = [
    { id: 1, name: 'Array', type: 'object' },
    { id: 2, name: 'Array', type: 'object' },
  ]
  const names = createNameMap(nodes, { 1: [{ index: 1, name: 0 }], 2: [] })
  expect(names[2].edgeName || names[2].nodeName).toBe('0')
})
