import EventEmitter from 'node:events'
import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Spawn/Spawn.js', () => {
  return {
    spawn: jest.fn(() => {
      throw new Error('not implemented')
    }),
  }
})

jest.unstable_mockModule('../src/parts/NodeVersion/NodeVersion.js', () => {
  return {
    nodeVersion: 'test-node-version',
  }
})

const LaunchElectron = await import('../src/parts/LaunchElectron/LaunchElectron.js')
const Spawn = await import('../src/parts/Spawn/Spawn.js')

test('launch - error - address already in use', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    const stdout = new EventEmitter()
    // @ts-ignore
    stdout.setEncoding = () => {}
    const stderr = new EventEmitter()
    // @ts-ignore
    stderr.setEncoding = () => {}

    setTimeout(() => {
      stderr.emit('data', `Starting inspector on 127.0.0.1:4444 failed: address already in use`)
    }, 0)
    return {
      stdout,
      stderr,
    }
  })
  // TODO mock WaitForDebuggerlistening module instead of mocking spawn
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrow(
    new Error(`Failed to launch electron: Starting inspector on 127.0.0.1:4444 failed: address already in use`),
  )
})

test('launch - error - unexpected first message', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    const stdout = new EventEmitter()
    // @ts-ignore
    stdout.setEncoding = () => {}
    const stderr = new EventEmitter()
    // @ts-ignore
    stderr.setEncoding = () => {}

    setTimeout(() => {
      stderr.emit('data', `abc`)
    }, 0)
    return {
      stdout,
      stderr,
    }
  })
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrow(
    new Error('Failed to launch electron: Failed to connect to debugger: Unexpected first message: abc'),
  )
})

test('launch - error - empty cli path', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    throw new Error("The argument 'file' cannot be empty. Received ''")
  })
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrow(
    new Error(`Failed to launch electron: The argument 'file' cannot be empty. Received ''`),
  )
})

test('launch - error - yarn is not installed', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    const stdout = new EventEmitter()
    // @ts-ignore
    stdout.setEncoding = () => {}
    const stderr = new EventEmitter()
    // @ts-ignore
    stderr.setEncoding = () => {}

    setTimeout(() => {
      stderr.emit(
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
    return {
      stdout,
      stderr,
    }
  })
  // @ts-ignore
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrow(
    new Error(`Failed to launch electron: yarn not installed in this node version (test-node-version)`),
  )
})
