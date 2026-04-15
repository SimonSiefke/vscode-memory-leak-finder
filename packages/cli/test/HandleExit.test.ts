import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const mockDelay = jest.fn().mockImplementation(async () => {})
const mockKillWorkers = jest.fn().mockImplementation(async () => {})
const mockStopSpecialStdin = jest.fn().mockImplementation(async () => {})
let platform = ''

jest.unstable_mockModule('../src/parts/Delay/Delay.ts', () => {
  return {
    delay: mockDelay,
  }
})

jest.unstable_mockModule('../src/parts/KillWorkers/KillWorkers.ts', () => {
  return {
    killWorkers: mockKillWorkers,
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => {
  return {
    getState() {
      return {
        platform,
      }
    },
  }
})

jest.unstable_mockModule('../src/parts/StopSpecialStdin/StopSpecialStdin.ts', () => {
  return {
    stopSpecialStdin: mockStopSpecialStdin,
  }
})

const HandleExit = await import('../src/parts/HandleExit/HandleExit.ts')

test('handleExit - macos waits before shutting down workers', async () => {
  platform = 'darwin'

  await HandleExit.handleExit()

  expect(mockDelay).toHaveBeenCalledTimes(1)
  expect(mockDelay).toHaveBeenCalledWith(5000)
  expect(mockStopSpecialStdin).toHaveBeenCalledTimes(1)
  expect(mockKillWorkers).toHaveBeenCalledTimes(1)
  expect(mockDelay.mock.invocationCallOrder[0]).toBeLessThan(mockStopSpecialStdin.mock.invocationCallOrder[0])
  expect(mockStopSpecialStdin.mock.invocationCallOrder[0]).toBeLessThan(mockKillWorkers.mock.invocationCallOrder[0])
})

test('handleExit - non-macos does not wait', async () => {
  platform = 'linux'

  await HandleExit.handleExit()

  expect(mockDelay).toHaveBeenCalledTimes(0)
  expect(mockStopSpecialStdin).toHaveBeenCalledTimes(1)
  expect(mockKillWorkers).toHaveBeenCalledTimes(1)
})
