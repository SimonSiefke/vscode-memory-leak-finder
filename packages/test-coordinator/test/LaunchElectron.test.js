import { jest } from '@jest/globals'
import EventEmitter from 'node:events'

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
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrowError(
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
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrowError(
    new Error('Failed to launch electron: Failed to connect to debugger: Unexpected first message: abc'),
  )
})

test('launch - error - empty cli path', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    throw new Error("The argument 'file' cannot be empty. Received ''")
  })
  await expect(LaunchElectron.launchElectron({ cliPath: '', args: [], headlessMode: true })).rejects.toThrowError(
    new Error(`Failed to launch electron: The argument 'file' cannot be empty. Received ''`),
  )
})
