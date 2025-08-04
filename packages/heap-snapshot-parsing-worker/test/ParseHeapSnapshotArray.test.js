import { test, expect } from '@jest/globals'
import { parseHeapSnapshotArray } from '../src/parts/ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

test('parseHeapSnapshotArray - parses simple comma-separated numbers', () => {
  const data = new TextEncoder().encode('1,2,3]')
  const array = new Uint32Array(3)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(3)
  expect(result.dataIndex).toBe(6) // Position after ']'
  expect(Array.from(array)).toEqual([1, 2, 3])
})

test('parseHeapSnapshotArray - parses single number', () => {
  const data = new TextEncoder().encode('42]')
  const array = new Uint32Array(1)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(1)
  expect(result.dataIndex).toBe(3) // Position after ']'
  expect(array[0]).toBe(42)
})

test('parseHeapSnapshotArray - parses empty array', () => {
  const data = new TextEncoder().encode(']')
  const array = new Uint32Array(0)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(0)
  expect(result.dataIndex).toBe(1) // Position after ']'
})

test('parseHeapSnapshotArray - handles partial number at end', () => {
  const data = new TextEncoder().encode('1,2,3')
  const array = new Uint32Array(3)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(false)
  expect(result.arrayIndex).toBe(2) // Only 1,2 are complete
  expect(result.dataIndex).toBe(3) // Backtrack to start of partial number
  expect(result.currentNumber).toBe(3)
  expect(result.hasDigits).toBe(true)
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(2)
})

test('parseHeapSnapshotArray - continues from previous state', () => {
  const data = new TextEncoder().encode('4]')
  const array = new Uint32Array(3)
  
  // Simulate previous state with partial number
  const result = parseHeapSnapshotArray(data, array, 2, 3, true)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(3)
  expect(result.dataIndex).toBe(2) // Position after ']'
  expect(array[2]).toBe(34) // 3 from previous + 4 from current
})

test('parseHeapSnapshotArray - handles large numbers', () => {
  const data = new TextEncoder().encode('123456789,987654321]')
  const array = new Uint32Array(2)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(2)
  expect(array[0]).toBe(123456789)
  expect(array[1]).toBe(987654321)
})

test('parseHeapSnapshotArray - handles zero values', () => {
  const data = new TextEncoder().encode('0,0,0]')
  const array = new Uint32Array(3)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(3)
  expect(Array.from(array)).toEqual([0, 0, 0])
})

test('parseHeapSnapshotArray - handles consecutive commas', () => {
  const data = new TextEncoder().encode('1,,3]')
  const array = new Uint32Array(3)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(2) // Only 1 and 3 are parsed
  expect(array[0]).toBe(1)
  expect(array[1]).toBe(3)
})

test('parseHeapSnapshotArray - handles whitespace around numbers', () => {
  const data = new TextEncoder().encode(' 1 , 2 , 3 ]')
  const array = new Uint32Array(3)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(3)
  expect(Array.from(array)).toEqual([1, 2, 3])
})

test('parseHeapSnapshotArray - throws error for unexpected token', () => {
  const data = new TextEncoder().encode('1,a,3]')
  const array = new Uint32Array(3)
  
  expect(() => {
    parseHeapSnapshotArray(data, array, 0)
  }).toThrow('unexpected token')
})

test('parseHeapSnapshotArray - handles negative numbers', () => {
  const data = new TextEncoder().encode('-1,-2,-3]')
  const array = new Uint32Array(3)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(3)
  expect(array[0]).toBe(-1)
  expect(array[1]).toBe(-2)
  expect(array[2]).toBe(-3)
})

test('parseHeapSnapshotArray - handles partial negative number', () => {
  const data = new TextEncoder().encode('1,-2')
  const array = new Uint32Array(2)
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(false)
  expect(result.arrayIndex).toBe(1) // Only 1 is complete
  expect(result.currentNumber).toBe(-2)
  expect(result.hasDigits).toBe(true)
  expect(array[0]).toBe(1)
})

test('parseHeapSnapshotArray - continues negative number from previous state', () => {
  const data = new TextEncoder().encode('3]')
  const array = new Uint32Array(2)
  
  // Simulate previous state with partial negative number
  const result = parseHeapSnapshotArray(data, array, 1, -2, true)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(2)
  expect(array[1]).toBe(-23) // -2 from previous + 3 from current
})

test('parseHeapSnapshotArray - handles array index out of bounds', () => {
  const data = new TextEncoder().encode('1,2,3,4]')
  const array = new Uint32Array(3) // Only space for 3 numbers
  
  expect(() => {
    parseHeapSnapshotArray(data, array, 0)
  }).toThrow('Array index 4 is out of bounds for array of length 3')
})

test('parseHeapSnapshotArray - handles incorrect number of elements', () => {
  const data = new TextEncoder().encode('1,2]')
  const array = new Uint32Array(3) // Expecting 3 numbers
  
  const result = parseHeapSnapshotArray(data, array, 0)
  
  expect(result.done).toBe(true)
  expect(result.arrayIndex).toBe(2)
  expect(() => {
    // This would be checked by the calling code
    if (result.arrayIndex !== array.length) {
      throw new Error(`Incorrect number of nodes in heapsnapshot, expected ${array.length}, but got ${result.arrayIndex}`)
    }
  }).toThrow('Incorrect number of nodes in heapsnapshot, expected 3, but got 2')
}) 