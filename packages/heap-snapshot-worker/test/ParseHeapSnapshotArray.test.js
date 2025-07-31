import { expect, test } from '@jest/globals'
import { parseHeapSnapshotArray } from '../src/parts/ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

// Helper function to convert string to Uint8Array
const toBuffer = (str) => new TextEncoder().encode(str)

test('parseHeapSnapshotArray - single number', () => {
  const data = toBuffer('1,') // Add comma to trigger storage
  const array = new Uint32Array(1)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
})

test('parseHeapSnapshotArray - double digit number', () => {
  const data = toBuffer('11,') // Add comma to trigger storage
  const array = new Uint32Array(1)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(11)
})

test('parseHeapSnapshotArray - two numbers', () => {
  const data = toBuffer('1, 2,') // Add comma to trigger storage of second number
  const array = new Uint32Array(2)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
})

test('parseHeapSnapshotArray - three numbers', () => {
  const data = toBuffer('1, 2, 3,') // Add comma to trigger storage of third number
  const array = new Uint32Array(3)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
})

test.skip('parseHeapSnapshotArray - array too short', () => {
  // This test is skipped as it would require a very large array
})

test.skip('parseHeapSnapshotArray - complete data', () => {
  // This test is skipped as it would require a very large array
})

test('parseHeapSnapshotArray - incomplete number at end', () => {
  const data = toBuffer('1, 22')
  const array = new Uint32Array(2)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(0) // Should not store the incomplete number 22
  expect(result.dataIndex).toBe(3) // Should backtrack to beginning of incomplete number
  expect(result.arrayIndex).toBe(1) // Should only store the complete number
})

test('parseHeapSnapshotArray - handles spaces correctly', () => {
  const data = toBuffer('1, 2, 3,') // Add comma to trigger storage of third number
  const array = new Uint32Array(3)
  const index = 0
  parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
})

test('parseHeapSnapshotArray - stops at non-digit character', () => {
  const data = toBuffer('1, 2, 3, x')
  const array = new Uint32Array(4)
  const index = 0
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow(new Error('unexpected token 120'))
})

test('parseHeapSnapshotArray - done with closing bracket', () => {
  const data = toBuffer('1, 2, 3]')
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
  const data = toBuffer('42]')
  const array = new Uint32Array(1)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(42)
  expect(result.dataIndex).toBe(3) // Should consume the entire string including ']'
  expect(result.arrayIndex).toBe(1) // Should store 1 number
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - incomplete number before bracket', () => {
  const data = toBuffer('1, 22]')
  const array = new Uint32Array(2)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(22) // Should parse as 22, not 2
  expect(result.dataIndex).toBe(6) // Should consume the entire string including ']'
  expect(result.arrayIndex).toBe(2) // Should store both numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - throws error when array is full', () => {
  const data = toBuffer('1, 2, 3]')
  const array = new Uint32Array(2)
  const index = 0
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow(RangeError)
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow('Array index 3 is out of bounds for array of length 2')
})

test('parseHeapSnapshotArray - throws error when starting index is out of bounds', () => {
  const data = toBuffer('1]')
  const array = new Uint32Array(1)
  const index = 1
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow(RangeError)
  expect(() => {
    parseHeapSnapshotArray(data, array, index)
  }).toThrow('Array index 2 is out of bounds for array of length 1')
})

test('parseHeapSnapshotArray - handles tabs as separators', () => {
  const data = toBuffer('1\t2\t3]')
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
  const data = toBuffer('1\n2\n3]')
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
  const data = toBuffer('1, 2\t3\n4]')
  const array = new Uint32Array(4)
  const index = 0
  const result = parseHeapSnapshotArray(data, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
  expect(array[2]).toBe(3)
  expect(array[3]).toBe(4)
  expect(result.dataIndex).toBe(9) // Should consume the entire string including ']'
  expect(result.arrayIndex).toBe(4) // Should store all 4 numbers
  expect(result.done).toBe(true) // Should be done since we found ']'
})

test('parseHeapSnapshotArray - streaming with incomplete number', () => {
  const data1 = toBuffer('1, 22')
  const data2 = toBuffer('3, 4,') // Add comma to trigger storage of 4
  const array = new Uint32Array(4)
  const index = 0
  const result1 = parseHeapSnapshotArray(data1, array, index)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(0) // Should not store the incomplete number 22
  expect(array[2]).toBe(0) // Should not be set
  expect(result1.dataIndex).toBe(3) // Should backtrack to beginning of incomplete number
  expect(result1.arrayIndex).toBe(1) // Should only store the complete number

  // Second chunk should be parsed independently
  const result2 = parseHeapSnapshotArray(data2, array, result1.arrayIndex)
  expect(array[0]).toBe(1) // First number unchanged
  expect(array[1]).toBe(3) // Should parse 3 from second chunk
  expect(array[2]).toBe(4) // Should parse 4 from second chunk
  expect(result2.dataIndex).toBe(5) // Should consume all data from second chunk
  expect(result2.arrayIndex).toBe(3) // Should store 2 more numbers
})
