import { expect, jest, test } from '@jest/globals'

const mockOriginalDispose = jest.fn<() => Promise<void>>()
const mockInvoke = jest.fn<() => Promise<void>>()
const mockCreate = jest.fn(async () => ({
  dispose: mockOriginalDispose,
  invoke: mockInvoke,
}))

jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  NodeWorkerRpcParent: {
    create: mockCreate,
  },
}))

const { launchInitializationWorker } = await import('../src/parts/LaunchInitializationWorker/LaunchInitializationWorker.ts')

test('dispose always terminates the worker when Launch.exit hangs', async () => {
  jest.useFakeTimers()
  mockInvoke.mockReturnValue(new Promise(() => {}))
  mockOriginalDispose.mockResolvedValue()

  const rpc = await launchInitializationWorker()
  const promise = rpc.dispose()
  const expectation = expect(promise).rejects.toThrow('Launch.exit timed out after 30000ms')
  await jest.advanceTimersByTimeAsync(30_000)

  await expectation
  expect(mockOriginalDispose).toHaveBeenCalledTimes(1)
  jest.useRealTimers()
})
