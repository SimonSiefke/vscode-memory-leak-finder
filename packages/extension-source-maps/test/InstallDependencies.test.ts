import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
})

test('installDependencies - skips installation when node_modules exists', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: (path: string) => {
      if (path === '/tmp/test-repo/node_modules') {
        return true
      }
      return false
    },
  }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await installDependencies(repoPath, nodeVersion)
})

test('installDependencies - successfully installs dependencies', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'
  const npmPath = '/home/user/.nvm/versions/node/v18.0.0/bin/npm'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: () => false,
  }))

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec') {
        callCount++
        if (command === 'bash' && args[0] === '-c' && args[1].includes('NVM_DIR')) {
          return {
            exitCode: 0,
            stdout: npmPath,
            stderr: '',
          }
        }
        if (command === npmPath && args[0] === 'ci') {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
      }
      throw new Error(`unexpected method ${method} command ${command}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await installDependencies(repoPath, nodeVersion)

  expect(callCount).toBe(2)
})

test('installDependencies - throws error when npm path not found', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: () => false,
  }))

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash' && args[0] === '-c' && args[1].includes('NVM_DIR')) {
        return {
          exitCode: 1,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method} command ${command}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await expect(installDependencies(repoPath, nodeVersion)).rejects.toThrow(
    `Could not find npm for node version ${nodeVersion} in nvm directories`,
  )
})

test('installDependencies - throws error when npm path is empty', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: () => false,
  }))

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash' && args[0] === '-c' && args[1].includes('NVM_DIR')) {
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method} command ${command}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await expect(installDependencies(repoPath, nodeVersion)).rejects.toThrow(
    `Could not find npm for node version ${nodeVersion} in nvm directories`,
  )
})

test('installDependencies - throws error when npm ci fails', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'
  const npmPath = '/home/user/.nvm/versions/node/v18.0.0/bin/npm'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: () => false,
  }))

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec') {
        if (command === 'bash' && args[0] === '-c' && args[1].includes('NVM_DIR')) {
          return {
            exitCode: 0,
            stdout: npmPath,
            stderr: '',
          }
        }
        if (command === npmPath && args[0] === 'ci') {
          return {
            exitCode: 1,
            stdout: '',
            stderr: 'npm ci failed',
          }
        }
      }
      throw new Error(`unexpected method ${method} command ${command}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await expect(installDependencies(repoPath, nodeVersion)).rejects.toThrow('npm ci failed')
})

test('installDependencies - uses npm from .config/nvm when .nvm not found', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'
  const npmPath = '/home/user/.config/nvm/versions/node/v18.0.0/bin/npm'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: () => false,
  }))

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec') {
        callCount++
        if (command === 'bash' && args[0] === '-c' && args[1].includes('NVM_DIR')) {
          return {
            exitCode: 0,
            stdout: npmPath,
            stderr: '',
          }
        }
        if (command === npmPath && args[0] === 'ci') {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
      }
      throw new Error(`unexpected method ${method} command ${command}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await installDependencies(repoPath, nodeVersion)

  expect(callCount).toBe(2)
})

test('installDependencies - throws VError when exec throws', async () => {
  const repoPath = '/tmp/test-repo'
  const nodeVersion = '18.0.0'

  jest.unstable_mockModule('node:fs', () => ({
    existsSync: () => false,
  }))

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

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')
  await expect(installDependencies(repoPath, nodeVersion)).rejects.toThrow(`Failed to install dependencies in '${repoPath}'`)
})

