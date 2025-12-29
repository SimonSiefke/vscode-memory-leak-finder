import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

test('buildExtension - runs npm ci and npm run compile successfully', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '18.0.0'

  const execCalls: Array<{ command: string; args: string[]; cwd?: string }> = []

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[], options: any) => {
      if (method === 'exec.exec') {
        execCalls.push({ command, args, cwd: options?.cwd })
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { buildExtension } = await import('../src/parts/BuildExtension/BuildExtension.ts')
  await buildExtension(repoPath, nodeVersion)

  expect(execCalls.length).toBe(2)
  expect(execCalls[0].command).toBe('bash')
  expect(execCalls[0].args[0]).toBe('-c')
  expect(execCalls[0].args[1]).toContain('npm ci')
  expect(execCalls[0].args[1]).toContain(nodeVersion)
  expect(execCalls[0].cwd).toBe(repoPath)
  expect(execCalls[1].command).toBe('bash')
  expect(execCalls[1].args[0]).toBe('-c')
  expect(execCalls[1].args[1]).toContain('npm run compile')
  expect(execCalls[1].args[1]).toContain(nodeVersion)
  expect(execCalls[1].cwd).toBe(repoPath)
})

test('buildExtension - falls back to npm run build when compile fails', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[], options: any) => {
      if (method === 'exec.exec') {
        callCount++
        if (callCount === 1) {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
        if (callCount === 2) {
          return {
            exitCode: 1,
            stdout: '',
            stderr: 'compile failed',
          }
        }
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { buildExtension } = await import('../src/parts/BuildExtension/BuildExtension.ts')
  await buildExtension(repoPath, nodeVersion)

  expect(callCount).toBe(3)
})

test('buildExtension - throws error when npm ci fails', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '18.0.0'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        return {
          exitCode: 1,
          stdout: '',
          stderr: 'npm ci failed',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { buildExtension } = await import('../src/parts/BuildExtension/BuildExtension.ts')
  await expect(buildExtension(repoPath, nodeVersion)).rejects.toThrow('npm ci failed: npm ci failed')
})

test('buildExtension - throws error when both compile and build fail', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        callCount++
        if (callCount === 1) {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
        return {
          exitCode: 1,
          stdout: '',
          stderr: 'build failed',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { buildExtension } = await import('../src/parts/BuildExtension/BuildExtension.ts')
  await expect(buildExtension(repoPath, nodeVersion)).rejects.toThrow('Build failed: build failed')
})

test('buildExtension - throws VError when exec throws', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '18.0.0'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        throw new Error('exec failed')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { buildExtension } = await import('../src/parts/BuildExtension/BuildExtension.ts')
  await expect(buildExtension(repoPath, nodeVersion)).rejects.toThrow(`Failed to build extension in '${repoPath}'`)
})

test('buildExtension - uses correct node version in commands', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '20.10.5'

  let capturedNodeVersion: string | undefined
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        const commandStr = args[1]
        if (commandStr.includes('nvm use')) {
          const match = commandStr.match(/nvm use (\S+)/)
          if (match) {
            capturedNodeVersion = match[1]
          }
        }
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { buildExtension } = await import('../src/parts/BuildExtension/BuildExtension.ts')
  await buildExtension(repoPath, nodeVersion)

  expect(capturedNodeVersion).toBe(nodeVersion)
})
