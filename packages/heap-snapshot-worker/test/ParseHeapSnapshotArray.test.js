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
  expect(array[1]).toBe(0) // Should not store the incomplete number 22
  expect(result.dataIndex).toBe(5) // Should consume all data
  expect(result.arrayIndex).toBe(1) // Should only store the complete number
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
  expect(result.done).toBe(false) // Should not be done since we stopped at 'a'
})

test('parseHeapSnapshotArray - done with closing bracket', () => {
  const data = `1, 2, 3]`
  const array = new Uint32Array(3)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
  expect(result.dataIndex).toBe(8) // Should consume the entire string including ']' (positions 0-7)
  expect(result.arrayIndex).toBe(3) // Should store all 3 numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - done with single number', () => {
  const data = `42]`
  const array = new Uint32Array(1)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(42)
  expect(result.dataIndex).toBe(3) // Should consume the entire string including ']'
  expect(result.arrayIndex).toBe(1) // Should store 1 number
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - incomplete number before bracket', () => {
  const data = `1, 22]`
  const array = new Uint32Array(2)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(22) // Should parse as 22, not 2
  expect(result.dataIndex).toBe(6) // Should consume the entire string including ']'
  expect(result.arrayIndex).toBe(2) // Should store both numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - throws error when array index out of bounds', () => {
  const data = `1, 2, 3]`
  const array = new Uint32Array(2) // Array can only hold 2 numbers
  const index = 0
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow(RangeError)
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow('Array index 2 is out of bounds for array of length 2')
})

test('parseHeapSnapshotArray - throws error when starting index is out of bounds', () => {
  const data = `1]`
  const array = new Uint32Array(1)
  const index = 1 // Starting at index 1, but array only has length 1
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow(RangeError)
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow('Array index 1 is out of bounds for array of length 1')
})

test('parseHeapSnapshotArray - handles tabs as separators', () => {
  const data = `1\t2\t3]`
  const array = new Uint32Array(3)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
  expect(result.dataIndex).toBe(6) // Should consume the entire string including ']' (positions 0-5)
  expect(result.arrayIndex).toBe(3) // Should store all 3 numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - handles newlines as separators', () => {
  const data = `1\n2\n3]`
  const array = new Uint32Array(3)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
  expect(result.dataIndex).toBe(6) // Should consume the entire string including ']' (positions 0-5)
  expect(result.arrayIndex).toBe(3) // Should store all 3 numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - handles mixed separators', () => {
  const data = `1, 2\t3\n4]`
  const array = new Uint32Array(4)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
  expect(array[3]).toBe(4)
  expect(result.dataIndex).toBe(9) // Should consume the entire string including ']' (positions 0-8)
  expect(result.arrayIndex).toBe(4) // Should store all 4 numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - streaming with incomplete number', () => {
  // First chunk: "1, 22" (incomplete number at end)
  const data1 = `1, 22`
  const array = new Uint32Array(3)
  const index = 0
  const result1 = parseHeapSnapshotArray(data1, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(0) // Should not store the incomplete number 22
  expect(array[2]).toBe(0) // Should not be set
  expect(result1.dataIndex).toBe(5) // Should consume all data
  expect(result1.arrayIndex).toBe(1) // Should only store the complete number
  expect(result1.done).toBe(false) // Should not be done

  // Second chunk: "3, 4]" (continuing from where we left off)
  const data2 = `3, 4]`
  const result2 = parseHeapSnapshotArray(data2, array, result1.arrayIndex)
  expect(array[1]).toBe(3) // Should parse as 3 (incomplete number from previous chunk is lost)
  expect(array[2]).toBe(4) // Should parse as 4
  expect(result2.dataIndex).toBe(5) // Should consume the entire string including ']'
  expect(result2.arrayIndex).toBe(3) // Should store 2 numbers starting from index 1
  expect(result2.done).toBe(true) // Should be done since we found ']'
})
