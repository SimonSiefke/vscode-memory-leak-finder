import { beforeEach, expect, jest, test } from '@jest/globals'

const calls: string[] = []
let resolveEvaluate: (() => void) | undefined
const evaluate = jest.fn((_rpc: unknown, options: { readonly expression: string }) => {
  calls.push('evaluate')
  expect(options.expression).toContain('___memoryLeakFinderObjectUrlTracker')
  return new Promise<void>((resolve) => {
    resolveEvaluate = resolve
  })
})
const runIfWaitingForDebugger = jest.fn(async () => {
  calls.push('resume')
  resolveEvaluate?.()
})

jest.unstable_mockModule('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts', () => ({
  createConnection: async () => ({}),
}))

jest.unstable_mockModule('../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts', () => ({
  createRpc: () => ({
    dispose: async () => {},
  }),
}))

jest.unstable_mockModule('../src/parts/WaitForSession/WaitForSession.ts', () => ({
  waitForSession: async () => ({
    sessionId: 'session-id',
    sessionRpc: {},
    targetId: 'target-id',
  }),
}))

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { evaluate, runIfWaitingForDebugger },
}))

const { connectDevtools } = await import('../src/parts/ConnectDevtools/ConnectDevtools.ts')

beforeEach(() => {
  calls.length = 0
  resolveEvaluate = undefined
  jest.clearAllMocks()
})

test.each(['objectUrlCount', 'objecturlcount', 'object-url-count'])(
  'installs %s tracking before the renderer resumes',
  async (measureId) => {
    await connectDevtools('ws://devtools', 1000, measureId)

    expect(calls).toEqual(['evaluate', 'resume'])
  },
)

test('does not install object URL tracking for other measures', async () => {
  await connectDevtools('ws://devtools', 1000, 'array-count')

  expect(evaluate).not.toHaveBeenCalled()
  expect(calls).toEqual(['resume'])
})
