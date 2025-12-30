import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
})

test('getLatestNodeVersionForMajor - returns latest version for major version 22', async () => {
  const mockVersions = [
    { version: 'v22.21.0' },
    { version: 'v22.14.0' },
    { version: 'v22.10.0' },
    { version: 'v21.5.0' },
    { version: 'v20.15.0' },
  ]

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

  const { getLatestNodeVersionForMajor } = await import('../src/parts/GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts')
  const version = await getLatestNodeVersionForMajor('22')
  expect(version).toBe('22.21.0')
})

test('getLatestNodeVersionForMajor - returns latest version for major version 20', async () => {
  const mockVersions = [
    { version: 'v20.15.0' },
    { version: 'v20.10.0' },
    { version: 'v20.5.0' },
    { version: 'v19.5.0' },
    { version: 'v18.20.0' },
  ]

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

  const { getLatestNodeVersionForMajor } = await import('../src/parts/GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts')
  const version = await getLatestNodeVersionForMajor('20')
  expect(version).toBe('20.15.0')
})

test('getLatestNodeVersionForMajor - returns latest version when multiple versions exist', async () => {
  const mockVersions = [
    { version: 'v18.20.5' },
    { version: 'v18.20.4' },
    { version: 'v18.20.3' },
    { version: 'v18.19.0' },
    { version: 'v18.18.0' },
  ]

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

  const { getLatestNodeVersionForMajor } = await import('../src/parts/GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts')
  const version = await getLatestNodeVersionForMajor('18')
  expect(version).toBe('18.20.5')
})

test('getLatestNodeVersionForMajor - throws error when no versions found for major version', async () => {
  const mockVersions = [
    { version: 'v20.15.0' },
    { version: 'v19.5.0' },
    { version: 'v18.20.0' },
  ]

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

  const { getLatestNodeVersionForMajor } = await import('../src/parts/GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts')
  await expect(getLatestNodeVersionForMajor('22')).rejects.toThrow('No Node.js versions found for major version 22')
})

test('getLatestNodeVersionForMajor - handles network worker error', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Network.getJson') {
        throw new Error('Network error')
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

  const { getLatestNodeVersionForMajor } = await import('../src/parts/GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts')
  await expect(getLatestNodeVersionForMajor('22')).rejects.toThrow('Failed to fetch latest Node.js version for major version 22')
})

