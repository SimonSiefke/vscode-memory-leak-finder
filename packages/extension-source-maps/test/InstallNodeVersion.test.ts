import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as InstallNodeVersion from '../src/parts/InstallNodeVersion/InstallNodeVersion.ts'
import * as Exec from '../src/parts/Exec/Exec.ts'

test('installNodeVersion - successfully installs and uses node version', async () => {
  const version = '18.0.0'
  const installedVersion = 'v18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
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
            exitCode: 0,
            stdout: installedVersion,
            stderr: '',
          }
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
})

test('installNodeVersion - sources nvm when command not found', async () => {
  const version = '18.0.0'
  const installedVersion = 'v18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        callCount++
        if (callCount === 1) {
          return {
            exitCode: 1,
            stdout: '',
            stderr: '',
          }
        }
        if (callCount === 2) {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
          }
        }
        if (callCount === 3) {
          return {
            exitCode: 0,
            stdout: installedVersion,
            stderr: '',
          }
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

test('installNodeVersion - throws error when nvm is not available', async () => {
  const version = '18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
        callCount++
        return {
          exitCode: 1,
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
  await expect(installNodeVersion(version)).rejects.toThrow('nvm is not available. Please install nvm to use this feature.')
})

test('installNodeVersion - throws error when install fails', async () => {
  const version = '18.0.0'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'bash') {
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
          stderr: 'install failed',
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
  await expect(installNodeVersion(version)).rejects.toThrow(`Failed to install node version ${version}`)
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
        if (commandStr.includes('nvm install')) {
          const match = commandStr.match(/nvm install (\S+)/)
          if (match) {
            capturedVersion = match[1]
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
