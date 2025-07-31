import { expect, test } from '@jest/globals'
import { parseHeapSnapshotArray } from '../src/parts/ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

test('parseHeapSnapshotArray - single number', () => {
  const data = `1]`
  const array = new Uint32Array(1)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
})

test('parseHeapSnapshotArray - double digit number', () => {
  const data = `11]`
  const array = new Uint32Array(1)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(11)
})

test('parseHeapSnapshotArray - two numbers', () => {
  const data = `1, 2]`
  const array = new Uint32Array(2)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
})

test('parseHeapSnapshotArray - three numbers', () => {
  const data = `1, 2, 3]`
  const array = new Uint32Array(3)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
})

test.skip('parseHeapSnapshotArray - array too short', () => {
  const data = `1, 2]`
  const array = new Uint32Array(1)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2) // TODO what should happen?
})

test.skip('parseHeapSnapshotArray - complete data', () => {
  // const data = `"nodes": []`
  // expect(parseHeapSnapshotArray(data, 'nodes')).toBe(10)
})

test('parseHeapSnapshotArray - incomplete number at end', () => {
  const data = `1, 22`
  const array = new Uint32Array(2)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(22)
  expect(result.dataIndex).toBe(5) // Should consume all data
  expect(result.arrayIndex).toBe(2) // Should store both numbers
})

test('parseHeapSnapshotArray - handles spaces correctly', () => {
  const data = `1,  2,   3]`
  const array = new Uint32Array(3)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
})

test('parseHeapSnapshotArray - stops at non-digit character', () => {
  const data = `1, 2, 3, a]`
  const array = new Uint32Array(4)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
  expect(array[3]).toBe(0) // Should not be set
  expect(result.dataIndex).toBe(9) // Should stop at 'a' (position 9)
  expect(result.arrayIndex).toBe(3) // Should only store 3 numbers
})
