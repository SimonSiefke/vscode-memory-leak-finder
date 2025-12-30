import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
})

test('exec - successfully executes command', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        return {
          exitCode: 0,
          stdout: 'test output',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  const result = await exec('echo', ['hello'], {})
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe('test output')
  expect(result.stderr).toBe('')
})

test('exec - handles command with non-zero exit code', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        return {
          exitCode: 1,
          stdout: '',
          stderr: 'error message',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  const result = await exec('false', [], {})
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toBe('error message')
})

test('exec - passes cwd option', async () => {
  let capturedOptions: any = null
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[], options: any) => {
      if (method === 'exec.exec') {
        capturedOptions = options
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  await exec('pwd', [], { cwd: '/test/dir' })
  expect(capturedOptions.cwd).toBe('/test/dir')
})

test('exec - passes env option', async () => {
  let capturedOptions: any = null
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[], options: any) => {
      if (method === 'exec.exec') {
        capturedOptions = options
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  await exec('env', [], { env: { TEST_VAR: 'test-value' } })
  expect(capturedOptions.env).toEqual({ TEST_VAR: 'test-value' })
})

test('exec - throws VError when RPC fails', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        throw new Error('RPC error')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  await expect(exec('test', [], {})).rejects.toThrow('Failed to execute command: test')
})

test('exec - handles empty args array', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  const result = await exec('test', [], {})
  expect(result.exitCode).toBe(0)
})

test('exec - handles multiple args', async () => {
  let capturedArgs: string[] = []
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec') {
        capturedArgs = args
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchExecWorker/LaunchExecWorker.ts', () => ({
    launchExecWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { exec } = await import('../src/parts/Exec/Exec.ts')
  await exec('git', ['clone', '--depth', '1', 'repo'], {})
  expect(capturedArgs).toEqual(['clone', '--depth', '1', 'repo'])
})
