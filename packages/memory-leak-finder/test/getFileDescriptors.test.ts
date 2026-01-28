import { test, expect } from '@jest/globals'
import { getFileDescriptors } from '../src/parts/GetFileDescriptors/getFileDescriptors/getFileDescriptors.ts'

test('getFileDescriptors - returns empty array for non-existent PID', async () => {
  // Using a very large PID that likely doesn't exist
  const pid = 9999999
  const result = await getFileDescriptors(pid)

  expect(result).toEqual([])
})

test('getFileDescriptors - returns array for current process', async () => {
  const pid = process.pid
  const result = await getFileDescriptors(pid)

  // The current process should have at least stdin, stdout, stderr
  expect(result.length).toBeGreaterThanOrEqual(3)
  expect(result[0]).toHaveProperty('description')
  expect(result[0]).toHaveProperty('fd')
  expect(result[0]).toHaveProperty('target')
})

test('getFileDescriptors - validates structure of returned descriptors', async () => {
  const pid = process.pid
  const result = await getFileDescriptors(pid)

  expect(result.length).toBeGreaterThan(0)

  for (const descriptor of result) {
    expect(typeof descriptor.description).toBe('string')
    expect(typeof descriptor.fd).toBe('string')
    expect(typeof descriptor.target).toBe('string')
  }
})
