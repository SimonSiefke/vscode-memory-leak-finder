import { test, expect, jest, beforeEach } from '@jest/globals'
import { platform } from 'node:os'
import { getFileDescriptorsForProcess } from '../src/parts/GetFileDescriptorsForProcess/GetFileDescriptorsForProcess.ts'

// Mock the os module
jest.mock('node:os', () => ({
  platform: jest.fn(),
}))

// Mock the dependencies
jest.mock('../src/parts/GetAllPids/GetAllPids.ts', () => ({
  getAllDescendantPids: jest.fn(),
}))

jest.mock('../src/parts/GetProcessName/GetProcessName.ts', () => ({
  getProcessName: jest.fn(),
}))

jest.mock('../src/parts/GetFileDescriptors/GetFileDescriptors.ts', () => ({
  getFileDescriptors: jest.fn(),
}))

const mockPlatform = platform as jest.MockedFunction<typeof platform>

beforeEach(() => {
  jest.clearAllMocks()
  mockPlatform.mockReturnValue('linux')
})

test('getFileDescriptorsForProcess - returns empty array for undefined PID', async () => {
  const result = await getFileDescriptorsForProcess(undefined)

  expect(result).toEqual([])
})

test('getFileDescriptorsForProcess - returns empty array for non-Linux platform', async () => {
  mockPlatform.mockReturnValue('darwin')

  const result = await getFileDescriptorsForProcess(1234)

  expect(result).toEqual([])
})

test('getFileDescriptorsForProcess - returns process info with descriptors', async () => {
  const { getAllDescendantPids } = await import('../src/parts/GetAllPids/GetAllPids.ts')
  const { getProcessName } = await import('../src/parts/GetFileDescriptors/getProcessName/getProcessName.ts')
  const { getFileDescriptors } = await import('../src/parts/GetFileDescriptors/getFileDescriptors/getFileDescriptors.ts')

  const mockGetAllDescendantPids = getAllDescendantPids as jest.MockedFunction<typeof getAllDescendantPids>
  const mockGetProcessName = getProcessName as jest.MockedFunction<typeof getProcessName>
  const mockGetFileDescriptors = getFileDescriptors as jest.MockedFunction<typeof getFileDescriptors>

  mockGetAllDescendantPids.mockResolvedValue([1234, 1235, 1236])
  mockGetProcessName.mockImplementation(async (pid) => `process-${pid}`)
  mockGetFileDescriptors.mockImplementation(async (pid) => [
    { description: 'socket', fd: `${pid}-1`, target: 'socket:[123]' },
    { description: 'pipe', fd: `${pid}-2`, target: 'pipe:[456]' },
  ])

  const result = await getFileDescriptorsForProcess(1234)

  expect(result).toHaveLength(3)
  expect(result[0].pid).toBeDefined()
  expect(result[0].name).toContain('process-')
  expect(result[0].fileDescriptorCount).toBe(2)
  expect(result[0].fileDescriptors).toHaveLength(2)
})

test('getFileDescriptorsForProcess - sorts by file descriptor count descending', async () => {
  const { getAllDescendantPids } = await import('../src/parts/GetAllPids/GetAllPids.ts')
  const { getProcessName } = await import('../src/parts/GetFileDescriptors/getProcessName/getProcessName.ts')
  const { getFileDescriptors } = await import('../src/parts/GetFileDescriptors/getFileDescriptors/getFileDescriptors.ts')

  const mockGetAllDescendantPids = getAllDescendantPids as jest.MockedFunction<typeof getAllDescendantPids>
  const mockGetProcessName = getProcessName as jest.MockedFunction<typeof getProcessName>
  const mockGetFileDescriptors = getFileDescriptors as jest.MockedFunction<typeof getFileDescriptors>

  mockGetAllDescendantPids.mockResolvedValue([1001, 1002, 1003])
  mockGetProcessName.mockImplementation(async (pid) => `process-${pid}`)
  mockGetFileDescriptors.mockImplementation(async (pid) => {
    // Return different numbers of descriptors
    if (pid === 1001) return [{ description: 'socket', fd: '1', target: 'socket:[1]' }]
    if (pid === 1002)
      return [
        { description: 'socket', fd: '1', target: 'socket:[1]' },
        { description: 'pipe', fd: '2', target: 'pipe:[2]' },
        { description: 'file', fd: '3', target: '/tmp/file' },
      ]
    if (pid === 1003)
      return [
        { description: 'socket', fd: '1', target: 'socket:[1]' },
        { description: 'pipe', fd: '2', target: 'pipe:[2]' },
      ]
    return []
  })

  const result = await getFileDescriptorsForProcess(1001)

  expect(result).toHaveLength(3)
  // Should be sorted by count: 3, 2, 1
  expect(result[0].fileDescriptorCount).toBe(3)
  expect(result[0].pid).toBe(1002)
  expect(result[1].fileDescriptorCount).toBe(2)
  expect(result[1].pid).toBe(1003)
  expect(result[2].fileDescriptorCount).toBe(1)
  expect(result[2].pid).toBe(1001)
})

test('getFileDescriptorsForProcess - handles errors gracefully', async () => {
  const { getAllDescendantPids } = await import('../src/parts/GetAllPids/GetAllPids.ts')
  const mockGetAllDescendantPids = getAllDescendantPids as jest.MockedFunction<typeof getAllDescendantPids>

  mockGetAllDescendantPids.mockRejectedValue(new Error('Failed to get PIDs'))

  const result = await getFileDescriptorsForProcess(1234)

  expect(result).toEqual([])
})

test('getFileDescriptorsForProcess - processes PIDs in parallel', async () => {
  const { getAllDescendantPids } = await import('../src/parts/GetAllPids/GetAllPids.ts')
  const { getProcessName } = await import('../src/parts/GetFileDescriptors/getProcessName/getProcessName.ts')
  const { getFileDescriptors } = await import('../src/parts/GetFileDescriptors/getFileDescriptors/getFileDescriptors.ts')

  const mockGetAllDescendantPids = getAllDescendantPids as jest.MockedFunction<typeof getAllDescendantPids>
  const mockGetProcessName = getProcessName as jest.MockedFunction<typeof getProcessName>
  const mockGetFileDescriptors = getFileDescriptors as jest.MockedFunction<typeof getFileDescriptors>

  const startTimes: number[] = []

  mockGetAllDescendantPids.mockResolvedValue([1001, 1002, 1003])
  mockGetProcessName.mockImplementation(async (pid) => {
    startTimes.push(Date.now())
    await new Promise((resolve) => setTimeout(resolve, 10))
    return `process-${pid}`
  })
  mockGetFileDescriptors.mockResolvedValue([])

  await getFileDescriptorsForProcess(1001)

  // If operations are truly parallel, all start times should be very close
  if (startTimes.length >= 2) {
    const maxDiff = Math.max(...startTimes) - Math.min(...startTimes)
    // Allow up to 50ms difference due to scheduling
    expect(maxDiff).toBeLessThan(50)
  }
})
