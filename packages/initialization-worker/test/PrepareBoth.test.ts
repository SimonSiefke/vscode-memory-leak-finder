import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/WaitForDebuggerListening/WaitForDebuggerListening.ts', () => {
  return {
    WaitForDebuggerListening: {},
    waitForDebuggerListening: async () => 'ws://electron-main',
  }
})

jest.unstable_mockModule('../src/parts/WaitForDevtoolsListening/WaitForDevtoolsListening.ts', () => {
  return {
    waitForDevtoolsListening: async () => 'ws://devtools',
  }
})

jest.unstable_mockModule('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts', () => {
  return {
    createConnection: async () => ({}),
  }
})

jest.unstable_mockModule('../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts', () => {
  return {
    createRpc: () => ({
      dispose: async () => {},
    }),
  }
})

jest.unstable_mockModule('../src/parts/ConnectElectron/ConnectElectron.ts', () => {
  return {
    connectElectron: async () => ({
      electronObjectId: 'electron-object',
      electronPid: 9876,
      monkeyPatchedElectronId: 'monkey-patched-electron',
    }),
  }
})

jest.unstable_mockModule('../src/parts/ConnectDevtools/ConnectDevtools.ts', () => {
  return {
    connectDevtools: async () => ({
      dispose: async () => {},
      sessionId: 'session-id',
      targetId: 'target-id',
    }),
  }
})

jest.unstable_mockModule('../src/parts/LaunchFunctionTrackerWorker/LaunchFunctionTrackerAndPreGenerateWorkbench.ts', () => {
  return {
    launchFunctionTrackerAndPreGenerateWorkbench: async () => {},
  }
})

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => {
  return {
    DevtoolsProtocolDebugger: {
      resume: async () => {},
    },
    DevtoolsProtocolRuntime: {
      callFunctionOn: async () => {},
      evaluate: async () => undefined,
    },
  }
})

const { prepareBoth } = await import('../src/parts/PrepareBoth/PrepareBoth.ts')

test('prepareBoth returns real electron process id from runtime evaluation', async () => {
  const result = await prepareBoth(
    '',
    true,
    1000,
    {
      on() {},
      start() {},
    } as any,
    '1.0.0',
    false,
    false,
    1,
    'cpuPerformanceCountersFromStart',
    1234,
    null,
    null,
    'functions',
  )

  expect(result.pid).toBe(9876)
})
