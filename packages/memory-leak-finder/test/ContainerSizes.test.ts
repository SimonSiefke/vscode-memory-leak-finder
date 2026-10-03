import { beforeEach, expect, jest, test } from '@jest/globals'

const evaluate = jest.fn<(...args: any[]) => Promise<any>>()
const queryObjects = jest.fn<(...args: any[]) => Promise<any>>()
const callFunctionOn = jest.fn<(...args: any[]) => Promise<any>>()
const releaseObjectGroup = jest.fn<(...args: any[]) => Promise<void>>()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { evaluate, queryObjects, callFunctionOn, releaseObjectGroup },
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  evaluate.mockResolvedValue({ objectId: 'prototype' })
  queryObjects.mockResolvedValue({ objects: { objectId: 'containers' } })
  callFunctionOn.mockResolvedValue(17)
  releaseObjectGroup.mockResolvedValue()
})

for (const kind of ['Map', 'Set']) {
  const measure = async (session: any) => {
    if (kind === 'Map') {
      return (await import('../src/parts/GetMapSize/GetMapSize.ts')).getMapSize(session)
    }
    return (await import('../src/parts/GetSetSize/GetSetSize.ts')).getSetSize(session)
  }

  test(`${kind} size releases queried containers before returning`, async () => {
    const session = {}
    await expect(measure(session)).resolves.toBe(17)

    const group = evaluate.mock.calls[0][1].objectGroup
    expect(group).toEqual(expect.any(String))
    expect(queryObjects).toHaveBeenCalledWith(session, { objectGroup: group, prototypeObjectId: 'prototype' })
    expect(releaseObjectGroup).toHaveBeenCalledWith(session, { objectGroup: group })
    expect(callFunctionOn.mock.invocationCallOrder[0]).toBeLessThan(releaseObjectGroup.mock.invocationCallOrder[0])
  })

  for (const failingCommand of [evaluate, queryObjects, callFunctionOn]) {
    test(`${kind} size releases its group when ${[evaluate, queryObjects, callFunctionOn].indexOf(failingCommand)} fails`, async () => {
      const failure = new Error('measurement failed')
      failingCommand.mockRejectedValue(failure)

      await expect(measure({})).rejects.toBe(failure)
      expect(releaseObjectGroup).toHaveBeenCalledTimes(1)
    })
  }
}
