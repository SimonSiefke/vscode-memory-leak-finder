import { beforeEach, expect, jest, test } from '@jest/globals'

const mockMkdir = jest.fn<(path: string, options: { recursive: boolean }) => Promise<void>>()
const mockRm = jest.fn<(path: string, options: { force: boolean; recursive: boolean }) => Promise<void>>()
const mockSetTimeout = jest.fn<(delay: number) => Promise<void>>()

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir: mockMkdir,
  rm: mockRm,
}))

jest.unstable_mockModule('node:timers/promises', () => ({
  setTimeout: mockSetTimeout,
}))

const CreateTestWorkspace = await import('../src/parts/CreateTestWorkspace/CreateTestWorkspace.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockMkdir.mockResolvedValue()
  mockRm.mockResolvedValue()
  mockSetTimeout.mockResolvedValue()
})

test('createTestWorkspace - retries when removing the workspace fails with EBUSY', async () => {
  const error = Object.assign(new Error('resource busy or locked'), { code: 'EBUSY' })
  mockRm.mockRejectedValueOnce(error)

  await CreateTestWorkspace.createTestWorkspace('/test-workspace')

  expect(mockRm).toHaveBeenCalledTimes(2)
  expect(mockSetTimeout).toHaveBeenCalledWith(1000)
  expect(mockMkdir).toHaveBeenCalledWith('/test-workspace', { recursive: true })
})

test('createTestWorkspace - does not retry other errors', async () => {
  const error = Object.assign(new Error('permission denied'), { code: 'EACCES' })
  mockRm.mockRejectedValueOnce(error)

  await expect(CreateTestWorkspace.createTestWorkspace('/test-workspace')).rejects.toBe(error)

  expect(mockRm).toHaveBeenCalledTimes(1)
  expect(mockSetTimeout).not.toHaveBeenCalled()
  expect(mockMkdir).not.toHaveBeenCalled()
})

test('createTestWorkspace - stops retrying EBUSY after two minutes', async () => {
  const error = Object.assign(new Error('resource busy or locked'), { code: 'EBUSY' })
  mockRm.mockRejectedValue(error)

  await expect(CreateTestWorkspace.createTestWorkspace('/test-workspace')).rejects.toBe(error)

  expect(mockRm).toHaveBeenCalledTimes(121)
  expect(mockSetTimeout).toHaveBeenCalledTimes(120)
  expect(mockSetTimeout).toHaveBeenCalledWith(1000)
  expect(mockMkdir).not.toHaveBeenCalled()
})
