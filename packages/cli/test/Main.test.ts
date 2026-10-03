import { beforeEach, expect, jest, test } from '@jest/globals'

const mockRun = jest.fn() as any
const mockCleanup = jest.fn() as any

jest.unstable_mockModule('../src/parts/Cli/Cli.ts', () => ({
  run: mockRun,
}))

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => ({
  cleanup: mockCleanup,
}))

const Main = await import('../src/parts/Main/Main.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('main runs cli and cleans up stdout worker', async () => {
  mockRun.mockResolvedValue(undefined)
  mockCleanup.mockResolvedValue(undefined)

  await Main.main()

  expect(mockRun).toHaveBeenCalledTimes(1)
  expect(mockCleanup).toHaveBeenCalledTimes(1)
})

test('main cleans up stdout worker when cli fails', async () => {
  const error = new Error('failed to run cli')
  mockRun.mockRejectedValue(error)
  mockCleanup.mockResolvedValue(undefined)

  await expect(Main.main()).rejects.toThrow('failed to run cli')
  expect(mockCleanup).toHaveBeenCalledTimes(1)
})
