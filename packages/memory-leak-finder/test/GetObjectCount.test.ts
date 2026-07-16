import { beforeEach, expect, jest, test } from '@jest/globals'

const mockEvaluate = jest.fn<(...args: any[]) => Promise<any>>()
const mockQueryObjects = jest.fn<(...args: any[]) => Promise<any>>()
const mockGetRemoteObjectLength = jest.fn<(...args: any[]) => Promise<number>>()
const mockCreateObjectGroup = jest.fn<() => string>()
const mockReleaseObjectGroup = jest.fn<(...args: any[]) => Promise<void>>()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: {
    evaluate: mockEvaluate,
    queryObjects: mockQueryObjects,
  },
}))

jest.unstable_mockModule('../src/parts/GetRemoteObjectLength/GetRemoteObjectLength.ts', () => ({
  getRemoteObjectLength: mockGetRemoteObjectLength,
}))

jest.unstable_mockModule('../src/parts/ObjectGroupId/ObjectGroupId.ts', () => ({
  create: mockCreateObjectGroup,
}))

jest.unstable_mockModule('../src/parts/ReleaseObjectGroup/ReleaseObjectGroup.ts', () => ({
  releaseObjectGroup: mockReleaseObjectGroup,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockCreateObjectGroup.mockReturnValue('og:test')
  mockEvaluate.mockResolvedValue({
    objectId: 'prototype-object',
  })
  mockQueryObjects.mockResolvedValue({
    objects: {
      objectId: 'queried-objects',
    },
  })
  mockGetRemoteObjectLength.mockResolvedValue(42)
  mockReleaseObjectGroup.mockResolvedValue()
})

test('getObjectCount owns and releases its object group after measuring', async () => {
  const GetObjectCount = await import('../src/parts/GetObjectCount/GetObjectCount.ts')
  const session = {} as any

  await expect(GetObjectCount.getObjectCount(session, 'Object.prototype')).resolves.toBe(42)

  expect(mockEvaluate).toHaveBeenCalledWith(session, {
    expression: 'Object.prototype',
    objectGroup: 'og:test',
    returnByValue: false,
  })
  expect(mockQueryObjects).toHaveBeenCalledWith(session, {
    objectGroup: 'og:test',
    prototypeObjectId: 'prototype-object',
  })
  expect(mockGetRemoteObjectLength).toHaveBeenCalledWith(session, 'queried-objects', 'og:test')
  expect(mockReleaseObjectGroup).toHaveBeenCalledWith(session, 'og:test')
  expect(mockGetRemoteObjectLength.mock.invocationCallOrder[0]).toBeLessThan(mockReleaseObjectGroup.mock.invocationCallOrder[0])
})

test('getObjectCount releases its object group when measuring fails', async () => {
  const error = new Error('query failed')
  mockQueryObjects.mockRejectedValue(error)
  const GetObjectCount = await import('../src/parts/GetObjectCount/GetObjectCount.ts')
  const session = {} as any

  await expect(GetObjectCount.getObjectCount(session, 'Object.prototype')).rejects.toBe(error)

  expect(mockReleaseObjectGroup).toHaveBeenCalledWith(session, 'og:test')
})
