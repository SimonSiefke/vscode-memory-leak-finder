import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('node:fs/promises', () => {
  return {
    chmod: jest.fn(),
  }
})

const MakeExecutable = await import('../src/parts/MakeExecutable/MakeExecutable.js')
const fs = await import('node:fs/promises')

test('makeExecutable', async () => {
  const file = '/test/file.txt'
  await MakeExecutable.makeExecutable(file)
  expect(fs.chmod).toHaveBeenCalledTimes(1)
  expect(fs.chmod).toHaveBeenCalledWith('/test/file.txt', 0o755)
})
