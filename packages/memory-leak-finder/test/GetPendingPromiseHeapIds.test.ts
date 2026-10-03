import { expect, jest, test } from '@jest/globals'

const evaluate = jest.fn()
const queryObjects = jest.fn()
const getProperties = jest.fn()
const getHeapObjectId = jest.fn()
const releaseObjectGroup = jest.fn()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolHeapProfiler: { getHeapObjectId },
  DevtoolsProtocolRuntime: { evaluate, getProperties, queryObjects },
}))
jest.unstable_mockModule('../src/parts/ReleaseObjectGroup/ReleaseObjectGroup.ts', () => ({ releaseObjectGroup }))

const { getPendingPromiseHeapIds } = await import('../src/parts/GetPendingPromiseHeapIds/GetPendingPromiseHeapIds.ts')

test('maps only pending Promise previews to heap snapshot object ids and releases the object group', async () => {
  evaluate.mockImplementation(async () => ({ objectId: 'prototype' }))
  queryObjects.mockImplementation(async () => ({ objects: { objectId: 'promises' } }))
  getProperties.mockImplementation(async () => ({
    result: [
      { enumerable: true, value: { objectId: 'pending', preview: { properties: [{ name: '[[PromiseState]]', value: 'pending' }] } } },
      { enumerable: true, value: { objectId: 'done', preview: { properties: [{ name: '[[PromiseState]]', value: 'fulfilled' }] } } },
    ],
  }))
  getHeapObjectId.mockImplementation(async () => ({ heapSnapshotObjectId: '123' }))
  await expect(getPendingPromiseHeapIds({} as any, 'group')).resolves.toEqual(['123'])
  expect(getHeapObjectId).toHaveBeenCalledWith({}, { objectId: 'pending' })
  expect(releaseObjectGroup).toHaveBeenCalledWith({}, 'group')
})
