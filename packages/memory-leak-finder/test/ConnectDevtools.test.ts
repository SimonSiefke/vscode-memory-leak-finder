import { test, expect, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as DevtoolsEventType from '../src/parts/DevtoolsEventType/DevtoolsEventType.ts'

test('connectDevtools sets up execution context created event handler', async () => {
  // Create a mock session RPC with an on method
  const mockOn = jest.fn()
  const mockSessionRpc = {
    on: mockOn,
    invoke: jest.fn().mockResolvedValue({}),
  }

  // Mock the debugger connection creation
  const mockCreateConnection = jest.fn().mockImplementation((url: string) => {
    if (url.includes('electron')) {
      return Promise.resolve({})
    }
    return Promise.resolve({})
  })

  // Mock the waitForSession function
  const mockWaitForSession = jest.fn().mockResolvedValue({
    sessionRpc: mockSessionRpc,
  })

  // Mock the GetCombinedMeasure
  const mockGetCombinedMeasure = jest.fn().mockResolvedValue({})

  // Mock MemoryLeakFinderState
  const mockSet = jest.fn()

  // Mock the modules
  jest.doMock('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts', () => ({
    createConnection: mockCreateConnection,
  }))

  jest.doMock('../src/parts/WaitForSession/WaitForSession.ts', () => ({
    waitForSession: mockWaitForSession,
  }))

  jest.doMock('../src/parts/GetCombinedMeasure/GetCombinedMeasure.ts', () => ({
    getCombinedMeasure: mockGetCombinedMeasure,
  }))

  jest.doMock('../src/parts/MemoryLeakFinderState/MemoryLeakFinderState.ts', () => ({
    set: mockSet,
  }))

  // Import the module after mocking
  const ConnectDevtoolsModule = await import('../src/parts/ConnectDevtools/ConnectDevtools.ts')

  // Call the function
  await ConnectDevtoolsModule.connectDevtools('ws://localhost:9222', 'ws://localhost:9223', 1, 'test-measure', 5000, false)

  // Verify that the event handler was set up
  expect(mockOn).toHaveBeenCalledWith(DevtoolsEventType.RuntimeExecutionContextCreated, expect.any(Function))
})
