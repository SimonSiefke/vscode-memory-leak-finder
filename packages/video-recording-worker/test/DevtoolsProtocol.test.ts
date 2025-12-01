import { expect, test } from '@jest/globals'
import * as DevtoolsProtocol from '../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts'

test('DevtoolsProtocol exports DevtoolsProtocolPage', () => {
  expect(DevtoolsProtocol.DevtoolsProtocolPage).toBeDefined()
  expect(typeof DevtoolsProtocol.DevtoolsProtocolPage).toBe('object')
})

test('DevtoolsProtocol exports DevtoolsProtocolRuntime', () => {
  expect(DevtoolsProtocol.DevtoolsProtocolRuntime).toBeDefined()
  expect(typeof DevtoolsProtocol.DevtoolsProtocolRuntime).toBe('object')
})

test('DevtoolsProtocol exports DevtoolsProtocolTarget', () => {
  expect(DevtoolsProtocol.DevtoolsProtocolTarget).toBeDefined()
  expect(typeof DevtoolsProtocol.DevtoolsProtocolTarget).toBe('object')
})

test('DevtoolsProtocol exports DevtoolsProtocolHeapProfiler', () => {
  expect(DevtoolsProtocol.DevtoolsProtocolHeapProfiler).toBeDefined()
  expect(typeof DevtoolsProtocol.DevtoolsProtocolHeapProfiler).toBe('object')
})

test('DevtoolsProtocol exports DevtoolsProtocolMemory', () => {
  expect(DevtoolsProtocol.DevtoolsProtocolMemory).toBeDefined()
  expect(typeof DevtoolsProtocol.DevtoolsProtocolMemory).toBe('object')
})

test('DevtoolsProtocol exports DevtoolsProtocolDomDebugger', () => {
  expect(DevtoolsProtocol.DevtoolsProtocolDomDebugger).toBeDefined()
  expect(typeof DevtoolsProtocol.DevtoolsProtocolDomDebugger).toBe('object')
})
