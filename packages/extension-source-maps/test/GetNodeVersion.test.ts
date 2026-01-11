import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

beforeEach(() => {
  jest.resetModules()
})

test('getNodeVersion - prefers .nvmrc with full version over package.json', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, '.nvmrc'), '18.20.0')
  const packageJson = {
    engines: {
      node: '>=20.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('18.20.0')
})

test('getNodeVersion - prefers .nvmrc with v prefix over package.json', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, '.nvmrc'), 'v20.15.0')
  const packageJson = {
    engines: {
      node: '>=18.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('20.15.0')
})

test('getNodeVersion - prefers .nvmrc with major.minor version over package.json', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, '.nvmrc'), '18.20')
  const packageJson = {
    engines: {
      node: '>=20.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('18.20.0')
})

test('getNodeVersion - prefers .nvmrc with major version and fetches latest', async () => {
  const mockVersions = [{ version: 'v18.20.0' }, { version: 'v18.19.0' }, { version: 'v20.15.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, '.nvmrc'), '18')
  const packageJson = {
    engines: {
      node: '>=20.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^18\.\d+\.\d+$/)
})

test('getNodeVersion - falls back to package.json when .nvmrc is empty', async () => {
  const mockVersions = [{ version: 'v20.15.0' }, { version: 'v20.10.0' }, { version: 'v18.20.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, '.nvmrc'), '')
  const packageJson = {
    engines: {
      node: '>=20.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^20\.\d+\.\d+$/)
})

test('getNodeVersion - falls back to package.json when .nvmrc has invalid content', async () => {
  const mockVersions = [{ version: 'v20.15.0' }, { version: 'v20.10.0' }, { version: 'v18.20.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, '.nvmrc'), 'lts/hydrogen')
  const packageJson = {
    engines: {
      node: '>=20.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^20\.\d+\.\d+$/)
})

test('getNodeVersion - extracts version from engines.node and fetches latest', async () => {
  const mockVersions = [{ version: 'v18.20.0' }, { version: 'v18.19.0' }, { version: 'v20.15.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '>=18.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^18\.\d+\.\d+$/)
})

test('getNodeVersion - handles version without patch and fetches latest', async () => {
  const mockVersions = [{ version: 'v20.15.0' }, { version: 'v20.10.0' }, { version: 'v18.20.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '>=20.5',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^20\.\d+\.\d+$/)
})

test('getNodeVersion - handles version with only major and fetches latest', async () => {
  const mockVersions = [{ version: 'v18.20.0' }, { version: 'v18.19.0' }, { version: 'v20.15.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '18',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^18\.\d+\.\d+$/)
})

test('getNodeVersion - throws error when engines.node is missing', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {}
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  await expect(getNodeVersion(tempDir)).rejects.toThrow('No node version specified in package.json engines')
})

test('getNodeVersion - throws error when engines is missing', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    name: 'test',
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  await expect(getNodeVersion(tempDir)).rejects.toThrow('No node version specified in package.json engines')
})

test('getNodeVersion - throws error when version cannot be parsed', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: 'invalid-version',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  await expect(getNodeVersion(tempDir)).rejects.toThrow('Could not parse node version from: invalid-version')
})

test('getNodeVersion - handles exact version and fetches latest', async () => {
  const mockVersions = [{ version: 'v20.15.0' }, { version: 'v20.10.0' }, { version: 'v18.20.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '20.10.5',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^20\.\d+\.\d+$/)
})

test('getNodeVersion - handles version with tilde and fetches latest', async () => {
  const mockVersions = [{ version: 'v18.20.0' }, { version: 'v18.19.0' }, { version: 'v20.15.0' }, { version: 'v19.5.0' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        return mockVersions
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
    launchNetworkWorker: async () => {
      return {
        invoke: mockRpc.invoke.bind(mockRpc),
        async [Symbol.asyncDispose]() {},
      }
    },
  }))

  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '~18.5.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toMatch(/^18\.\d+\.\d+$/)
})

test('getNodeVersion - throws VError when package.json does not exist', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await expect(getNodeVersion(tempDir)).rejects.toThrow("Failed to get node version from '")
})

test('getNodeVersion - throws VError when package.json is invalid JSON', async () => {
  const { getNodeVersion } = await import('../src/parts/GetNodeVersion/GetNodeVersion.ts')

  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, 'package.json'), 'invalid json')

  await expect(getNodeVersion(tempDir)).rejects.toThrow("Failed to get node version from '")
})
