import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('node:fs/promises', () => {
  return {
    chmod: jest.fn(),
  }
})

const MakeExecutable = await import('../src/parts/MakeExecutable/MakeExecutable.js')
const fs = await import('node:fs/promises')

test('makeExecutable - error', async () => {
  jest.spyOn(fs, 'chmod').mockRejectedValue(new TypeError('x is not a function'))
  const file = '/test/file.txt'
  await expect(MakeExecutable.makeExecutable(file)).rejects.toThrow(
    new Error('Failed to make file executable: TypeError: x is not a function'),
  )
})

test('makeExecutable', async () => {
  const file = '/test/file.txt'
  await MakeExecutable.makeExecutable(file)
  expect(fs.chmod).toHaveBeenCalledTimes(1)
  expect(fs.chmod).toHaveBeenCalledWith('/test/file.txt', 0o755)
})
