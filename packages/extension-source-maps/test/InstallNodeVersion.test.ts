import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
})

test('installNodeVersion - successfully installs and uses node version', async () => {
  const version = '18.0.0'
  const installedVersion = 'v18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        callCount++
        const commandStr = args[1]
        if (commandStr.includes('versions/node/v')) {
          return {
            exitCode: 0,
            stdout: 'not_installed',
            stderr: '',
          }
        }
        if (commandStr.includes('nvm install')) {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
        if (commandStr.includes('node --version')) {
          return {
            exitCode: 0,
            stdout: installedVersion,
            stderr: '',
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

  const { installNodeVersion } = await import('../src/parts/InstallNodeVersion/InstallNodeVersion.ts')
  const result = await installNodeVersion(version)

  expect(result).toBe(installedVersion)
  expect(callCount).toBe(3)
})

test('installNodeVersion - skips install when version already installed', async () => {
  const version = '18.0.0'
  const installedVersion = 'v18.0.0'

  let callCount = 0
  let installCalled = false
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        callCount++
        const commandStr = args[1]
        if (commandStr.includes('nvm list')) {
          return {
            exitCode: 0,
            stdout: 'installed',
            stderr: '',
          }
        }
        if (commandStr.includes('nvm install')) {
          installCalled = true
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
        if (commandStr.includes('node --version')) {
          return {
            exitCode: 0,
            stdout: installedVersion,
            stderr: '',
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

  const { installNodeVersion } = await import('../src/parts/InstallNodeVersion/InstallNodeVersion.ts')
  const result = await installNodeVersion(version)

  expect(result).toBe(installedVersion)
  expect(callCount).toBe(2)
  expect(installCalled).toBe(false)
})

test('installNodeVersion - throws error when nvm is not available', async () => {
  const version = '18.0.0'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        return {
          exitCode: 1,
          stdout: '',
          stderr: 'nvm: command not found',
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

  const { installNodeVersion } = await import('../src/parts/InstallNodeVersion/InstallNodeVersion.ts')
  await expect(installNodeVersion(version)).rejects.toThrow(`Failed to install node version ${version}: nvm: command not found`)
})

test('installNodeVersion - throws error when install fails', async () => {
  const version = '18.0.0'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        const commandStr = args[1]
        if (commandStr.includes('nvm list')) {
          return {
            exitCode: 0,
            stdout: 'not_installed',
            stderr: '',
          }
        }
        if (commandStr.includes('nvm install')) {
          return {
            exitCode: 1,
            stdout: '',
            stderr: 'install failed',
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

  const { installNodeVersion } = await import('../src/parts/InstallNodeVersion/InstallNodeVersion.ts')
  await expect(installNodeVersion(version)).rejects.toThrow(`Failed to install node version ${version}: install failed`)
})

test('installNodeVersion - throws VError when exec throws', async () => {
  const version = '18.0.0'

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

  const { installNodeVersion } = await import('../src/parts/InstallNodeVersion/InstallNodeVersion.ts')
  await expect(installNodeVersion(version)).rejects.toThrow(`Failed to install node version '${version}'`)
})

test('installNodeVersion - uses correct version in install command', async () => {
  const version = '20.10.5'
  const installedVersion = 'v20.10.5'

  let capturedVersion: string | undefined
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        const commandStr = args[1]
        if (commandStr.includes('nvm list')) {
          return {
            exitCode: 0,
            stdout: 'not_installed',
            stderr: '',
          }
        }
        if (commandStr.includes('nvm install')) {
          const match = commandStr.match(/nvm install (\S+)/)
          if (match) {
            capturedVersion = match[1]
          }
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
        if (commandStr.includes('node --version')) {
          return {
            exitCode: 0,
            stdout: installedVersion,
            stderr: '',
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

  const { installNodeVersion } = await import('../src/parts/InstallNodeVersion/InstallNodeVersion.ts')
  await installNodeVersion(version)

  expect(capturedVersion).toBe(version)
})
