import { beforeEach, expect, jest, test } from '@jest/globals'

const mockCallFunctionOn = jest.fn<(...args: any[]) => Promise<any>>()
const mockEvaluate = jest.fn<(...args: any[]) => Promise<any>>()
const mockGetProperties = jest.fn<(...args: any[]) => Promise<any>>()
const mockQueryObjects = jest.fn<(...args: any[]) => Promise<any>>()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: {
    callFunctionOn: mockCallFunctionOn,
    evaluate: mockEvaluate,
    getProperties: mockGetProperties,
    queryObjects: mockQueryObjects,
  },
}))

const GetPromisesWithStackTraces = await import('../src/parts/GetPromisesWithStackTraces/GetPromisesWithStackTraces.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockEvaluate.mockResolvedValue({
    objectId: 'promise-prototype',
  })
  mockQueryObjects.mockResolvedValue({
    objects: {
      objectId: 'promises',
    },
  })
  mockGetProperties.mockResolvedValue({
    result: [
      {
        enumerable: true,
        value: {
          description: 'Promise',
          preview: {
            properties: [{ name: 'status', value: 'pending' }],
          },
        },
      },
      {
        enumerable: true,
        value: {
          description: 'Promise',
          preview: {
            properties: [{ name: 'status', value: 'pending' }],
          },
        },
      },
      {
        enumerable: true,
        value: {
          description: 'Promise',
          preview: {
            properties: [{ name: 'status', value: 'resolved' }],
          },
        },
      },
    ],
  })
})

test('transfers repeated Promise stack traces once and reconstructs them', async () => {
  const promises = [{}, {}, {}]
  ;(globalThis as any).___promiseStackTraces = new Map([
    [promises[0], 'createPromise (workbench.js:1:2)'],
    [promises[1], 'createPromise (workbench.js:1:2)'],
    [promises[2], 'resolvePromise (workbench.js:3:4)'],
  ])
  let transferred: any
  mockCallFunctionOn.mockImplementation(async (_session, options) => {
    const getStackTraces = Function(`return (${options.functionDeclaration})`)()
    transferred = getStackTraces.call(promises)
    return transferred
  })

  try {
    const result = await GetPromisesWithStackTraces.getPromisesWithStackTraces({} as any, 'object-group')

    expect(transferred).toEqual({
      stackTraceIndexes: [0, 0, 1],
      stackTraces: ['createPromise (workbench.js:1:2)', 'resolvePromise (workbench.js:3:4)'],
    })
    expect(result).toEqual([
      {
        description: 'Promise',
        preview: {
          properties: [{ name: 'status', value: 'pending' }],
        },
        stackTrace: 'createPromise (workbench.js:1:2)',
      },
      {
        description: 'Promise',
        preview: {
          properties: [{ name: 'status', value: 'pending' }],
        },
        stackTrace: 'createPromise (workbench.js:1:2)',
      },
      {
        description: 'Promise',
        preview: {
          properties: [{ name: 'status', value: 'resolved' }],
        },
        stackTrace: 'resolvePromise (workbench.js:3:4)',
      },
    ])
  } finally {
    delete (globalThis as any).___promiseStackTraces
  }
})
