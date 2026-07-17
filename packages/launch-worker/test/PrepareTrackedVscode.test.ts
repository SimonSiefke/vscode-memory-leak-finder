import { expect, jest, test } from '@jest/globals'

const events: string[] = []

const rpc = {
  async invoke(method: string, binaryPath: string, trackingMode: string): Promise<string> {
    events.push(`invoke:${method}:${binaryPath}:${trackingMode}`)
    await Promise.resolve()
    events.push('invoke-complete')
    return '/tmp/tracked-code'
  },
  async [Symbol.asyncDispose](): Promise<void> {
    events.push('dispose')
  },
}

jest.unstable_mockModule('../src/parts/LaunchFunctionTrackerWorker/LaunchFunctionTrackerWorker.ts', () => ({
  launchFunctionTrackerWorker: jest.fn(async () => rpc),
}))

test('prepareTrackedVscode waits for preparation before disposing the worker', async () => {
  const PrepareTrackedVscode = await import('../src/parts/PrepareTrackedVscode/PrepareTrackedVscode.ts')

  const result = await PrepareTrackedVscode.prepareTrackedVscode('/tmp/code', 'timeouts')

  expect(result).toBe('/tmp/tracked-code')
  expect(events).toEqual(['invoke:FunctionTracker.getPreparedVscodePath:/tmp/code:timeouts', 'invoke-complete', 'dispose'])
})
