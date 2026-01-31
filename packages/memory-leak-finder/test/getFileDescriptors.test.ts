import { test, expect } from '@jest/globals'
import { getFileDescriptors } from '../src/parts/GetFileDescriptors/GetFileDescriptors.ts'

test('getFileDescriptors - returns empty array for non-existent PID', async () => {
  // Using a very large PID that likely doesn't exist
  const pid = 9999999
  const result = await getFileDescriptors(pid)

  expect(result).toEqual([])
})

test('getFileDescriptors - returns array or empty array based on platform', async () => {
  const pid = process.pid
  const result = await getFileDescriptors(pid)

  // On Linux, should have file descriptors; on other platforms might be empty
  // Just verify it's an array with the correct structure if not empty
  expect(Array.isArray(result)).toBe(true)

  if (result.length > 0) {
    expect(result[0]).toHaveProperty('description')
    expect(result[0]).toHaveProperty('fd')
    expect(result[0]).toHaveProperty('target')
  }
})

test('getFileDescriptors - returns array with correct descriptor structure', async () => {
  const pid = process.pid
  const result = await getFileDescriptors(pid)

  // Result should always be an array
  expect(Array.isArray(result)).toBe(true)

  // If we have descriptors, validate their structure
  for (const descriptor of result) {
    expect(typeof descriptor.description).toBe('string')
    expect(typeof descriptor.fd).toBe('string')
    expect(typeof descriptor.target).toBe('string')
  }
})
