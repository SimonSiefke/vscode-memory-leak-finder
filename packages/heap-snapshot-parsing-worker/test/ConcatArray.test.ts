import { test, expect } from '@jest/globals'
import { concatArray, concatUint32Array } from '../src/parts/ConcatArray/ConcatArray.ts'

test('concatArray - concatenates two non-empty arrays', () => {
  const array1 = new Uint8Array([1, 2, 3])
  const array2 = new Uint8Array([4, 5, 6])
  const result = concatArray(array1, array2)

  expect(result).toBeInstanceOf(Uint8Array)
  expect(result.length).toBe(6)
  expect([...result]).toEqual([1, 2, 3, 4, 5, 6])
})

test('concatArray - returns other array when first array is empty', () => {
  const array1 = new Uint8Array(0)
  const array2 = new Uint8Array([1, 2, 3])
  const result = concatArray(array1, array2)

  expect(result).toBe(array2)
  expect(result.length).toBe(3)
  expect([...result]).toEqual([1, 2, 3])
})

test('concatArray - handles empty second array', () => {
  const array1 = new Uint8Array([1, 2, 3])
  const array2 = new Uint8Array(0)
  const result = concatArray(array1, array2)

  expect(result).toBeInstanceOf(Uint8Array)
  expect(result.length).toBe(3)
  expect([...result]).toEqual([1, 2, 3])
})

test('concatArray - handles both arrays empty', () => {
  const array1 = new Uint8Array(0)
  const array2 = new Uint8Array(0)
  const result = concatArray(array1, array2)

  expect(result).toBe(array2)
  expect(result.length).toBe(0)
})

test('concatUint32Array - concatenates two non-empty arrays', () => {
  const array1 = new Uint32Array([1, 2, 3])
  const array2 = new Uint32Array([4, 5, 6])
  const result = concatUint32Array(array1, array2)

  expect(result).toBeInstanceOf(Uint32Array)
  expect(result.length).toBe(6)
  expect([...result]).toEqual([1, 2, 3, 4, 5, 6])
})

test('concatUint32Array - handles empty first array', () => {
  const array1 = new Uint32Array(0)
  const array2 = new Uint32Array([1, 2, 3])
  const result = concatUint32Array(array1, array2)

  expect(result).toBeInstanceOf(Uint32Array)
  expect(result.length).toBe(3)
  expect([...result]).toEqual([1, 2, 3])
})

test('concatUint32Array - handles empty second array', () => {
  const array1 = new Uint32Array([1, 2, 3])
  const array2 = new Uint32Array(0)
  const result = concatUint32Array(array1, array2)

  expect(result).toBeInstanceOf(Uint32Array)
  expect(result.length).toBe(3)
  expect([...result]).toEqual([1, 2, 3])
})

test('concatUint32Array - handles both arrays empty', () => {
  const array1 = new Uint32Array(0)
  const array2 = new Uint32Array(0)
  const result = concatUint32Array(array1, array2)

  expect(result).toBeInstanceOf(Uint32Array)
  expect(result.length).toBe(0)
})

test('concatUint32Array - handles large arrays', () => {
  const array1 = new Uint32Array(1000).fill(1)
  const array2 = new Uint32Array(1000).fill(2)
  const result = concatUint32Array(array1, array2)

  expect(result).toBeInstanceOf(Uint32Array)
  expect(result.length).toBe(2000)
  expect(result[0]).toBe(1)
  expect(result[999]).toBe(1)
  expect(result[1000]).toBe(2)
  expect(result[1999]).toBe(2)
})
