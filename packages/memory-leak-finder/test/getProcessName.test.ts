import { test, expect } from '@jest/globals'
import { getProcessName } from '../src/parts/GetFileDescriptors/getProcessName/getProcessName.ts'

test('getProcessName - current process returns a valid name', async () => {
  const pid = process.pid
  const result = await getProcessName(pid)

  // Should return a non-empty string
  expect(result).toBeTruthy()
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
  expect(result).not.toBe('unknown')
})

test('getProcessName - non-existent PID returns unknown', async () => {
  const pid = 9999999 // Very large PID that likely doesn't exist
  const result = await getProcessName(pid)

  expect(result).toBe('unknown')
})

test('getProcessName - process name is not too long', async () => {
  const pid = process.pid
  const result = await getProcessName(pid)

  // Should not exceed 50 characters
  expect(result.length).toBeLessThanOrEqual(50)
})

test('getProcessName - handles Node.js process', async () => {
  const pid = process.pid
  const result = await getProcessName(pid)

  // Current process is Node.js or contains "node" in the name
  expect(result.toLowerCase()).toContain('node')
})
