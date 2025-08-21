import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

const mockRpc = MockRpc.create({
  commandMap: {},
  invoke: (method: string) => {
    if (method === 'Stdout.getWatchUsageMessage') {
      return 'watch usage'
    }
    throw new Error(`unexpected method ${method}`)
  },
})

StdoutWorker.set(mockRpc)

jest.unstable_mockModule('../src/parts/WatchUsage/WatchUsage.ts', () => {
  return {
    print: jest.fn(() => 'watch usage'),
  }
})

jest.unstable_mockModule('../src/parts/SpecialStdin/SpecialStdin.ts', () => {
  return {
    start: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StartRunning/StartRunning.ts', () => {
  return {
    startRunning: jest.fn(),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const InitialStart = await import('../src/parts/InitialStart/InitialStart.ts')
const SpecialStdin = await import('../src/parts/SpecialStdin/SpecialStdin.ts')
const StartRunning = await import('../src/parts/StartRunning/StartRunning.ts')
const WatchUsage = await import('../src/parts/WatchUsage/WatchUsage.ts')

test('initialStart - watch mode - show details', async () => {
  const options = {
    watch: true,
    filter: '',
  }
  // @ts-ignore
  WatchUsage.print.mockImplementation(async () => 'watch usage')
  await InitialStart.initialStart(options)
  expect(SpecialStdin.start).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('watch usage')
  expect(StartRunning.startRunning).not.toHaveBeenCalled()
})

test('initialStart - watch mode - start running', async () => {
  const options = {
    watch: true,
    filter: 'a',
  }
  await InitialStart.initialStart(options)
  expect(SpecialStdin.start).toHaveBeenCalledTimes(1)
  expect(Stdout.write).not.toHaveBeenCalled()
  expect(StartRunning.startRunning).toHaveBeenCalledTimes(1)
  expect(StartRunning.startRunning).toHaveBeenCalledWith(
    'a',
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  )
})

test('initialStart - start running', async () => {
  const options = {
    watch: false,
    filter: 'a',
  }
  await InitialStart.initialStart(options)
  expect(SpecialStdin.start).not.toHaveBeenCalled()
  expect(Stdout.write).not.toHaveBeenCalled()
  expect(StartRunning.startRunning).toHaveBeenCalledTimes(1)
  expect(StartRunning.startRunning).toHaveBeenCalledWith(
    'a',
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  )
})
