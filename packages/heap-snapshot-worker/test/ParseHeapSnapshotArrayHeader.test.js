import { expect, test } from '@jest/globals'
import { parseHeapSnapshotArrayHeader } from '../src/parts/ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'

test('parseHeapSnapshotArrayHeader - incomplete snapshot token', () => {
  const data = `"nodes`
  expect(parseHeapSnapshotArrayHeader(data, 'nodes')).toBe(-1)
})

test('parseHeapSnapshotArrayHeader - incomplete data', () => {
  const data = `"nodes": `
  expect(parseHeapSnapshotArrayHeader(data, 'nodes')).toBe(-1)
})

test('parseHeapSnapshotArrayHeader - complete data', () => {
  const data = `"nodes": []`
  expect(parseHeapSnapshotArrayHeader(data, 'nodes')).toBe(10)
})
