import { expect, test } from '@jest/globals'
import { parseHeapSnapshotMetaData } from '../src/parts/ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'

test('parseHeapSnapshotMetaData - incomplete snapshot token', () => {
  const data = `{
  "snaps`
  expect(parseHeapSnapshotMetaData(data)).toEqual({})
})

test('parseHeapSnapshotMetaData - incomplete data', () => {
  const data = `{
  "snapshot": { "metadata": {}`
  expect(parseHeapSnapshotMetaData(data)).toEqual({})
})

test('parseHeapSnapshotMetaData - complete data', () => {
  const data = `{
  "snapshot": { "metadata": {} }`
  expect(parseHeapSnapshotMetaData(data)).toEqual({
    metadata: {},
  })
})
