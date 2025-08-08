import { expect, test } from '@jest/globals'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../src/parts/ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'

test('parseHeapSnapshotMetaData - incomplete snapshot token', () => {
  const data = `{
  "snaps`
  expect(parseHeapSnapshotMetaData(data)).toBe(EMPTY_DATA)
})

test('parseHeapSnapshotMetaData - incomplete data', () => {
  const data = `{
  "snapshot": { "metadata": {}`
  expect(parseHeapSnapshotMetaData(data)).toBe(EMPTY_DATA)
})

test('parseHeapSnapshotMetaData - complete data', () => {
  const data = `{
  "snapshot": { "metadata": {} }`
  expect(parseHeapSnapshotMetaData(data)).toEqual({
    couldParse: true,
    data: {
      metadata: {},
    },
    endIndex: 34,
  })
})

test('parseHeapSnapshotMetaData - complete curly bracket in property name', () => {
  const data = `{
  "snapshot": { "{": {} }`
  expect(parseHeapSnapshotMetaData(data)).toEqual({
    couldParse: true,
    data: {
      '{': {},
    },
    endIndex: 27,
  })
})

test('parseHeapSnapshotMetaData - complete quote in property name', () => {
  // TODO would be correct to support this also, but generally this shouldn't occur in metadata
  const data = `{
  "snapshot": { "\\"test": {} }`
  expect(parseHeapSnapshotMetaData(data)).toBe(EMPTY_DATA)
})
