import { jest } from '@jest/globals'
import EventEmitter from 'node:events'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/NodeVersion/NodeVersion.js', () => {
  return {
    nodeVersion: 'test-node-version',
  }
})

const WaitForDebuggerListening = await import('../src/parts/WaitForDebuggerListening/WaitForDebuggerListening.js')

test('waitForDebuggerListening - error - address already in use', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', `Starting inspector on 127.0.0.1:4444 failed: address already in use\n`)
  }, 0)
  await expect(WaitForDebuggerListening.waitForDebuggerListening(stream)).rejects.toThrow(
    new Error(`Starting inspector on 127.0.0.1:4444 failed: address already in use`),
  )
})

test('waitForDebuggerListening - error - yarn not installed', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit(
      'data',
      `Error: spawn yarn ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process:284:19)
    at onErrorNT (node:internal/child_process:477:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'spawn yarn',
  path: 'yarn',
  spawnargs: [ 'electron' ]
}`,
    )
  }, 0)
  await expect(WaitForDebuggerListening.waitForDebuggerListening(stream)).rejects.toThrow(
    new Error(`yarn not installed in this node version (test-node-version)`),
  )
})
