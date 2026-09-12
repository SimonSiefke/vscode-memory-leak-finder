import { beforeEach, expect, jest, test } from '@jest/globals'

const mockCallFunctionOn = jest.fn<(...args: any[]) => Promise<any>>()
const mockGetProperties = jest.fn<(...args: any[]) => Promise<any>>()
const mockGetDetachedDomNodeRoots = jest.fn<(...args: any[]) => Promise<any>>()
const mockCleanDetachedDomNodesWithStackTraces = jest.fn<(...args: any[]) => Promise<any>>()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: {
    callFunctionOn: mockCallFunctionOn,
    getProperties: mockGetProperties,
  },
}))

jest.unstable_mockModule('../src/parts/GetDetachedDomNodeRoots/GetDetachedDomNodeRoots.ts', () => ({
  getDetachedDomNodeRoots: mockGetDetachedDomNodeRoots,
}))

jest.unstable_mockModule('../src/parts/CleanDetachedDomNodesWithStackTraces/CleanDetachedDomNodesWithStackTraces.ts', () => ({
  cleanDetachedDomNodesWithStackTraces: mockCleanDetachedDomNodesWithStackTraces,
}))

const GetDetachedDomNodesWithStackTraces =
  await import('../src/parts/GetDetachedDomNodesWithStackTraces/GetDetachedDomNodesWithStackTraces.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockGetDetachedDomNodeRoots.mockResolvedValue({
    objectId: 'detached-roots',
  })
  mockGetProperties.mockResolvedValue({
    result: [
      {
        enumerable: true,
        value: {
          className: 'HTMLDivElement',
          description: 'div.first',
        },
      },
      {
        enumerable: true,
        value: {
          className: 'HTMLDivElement',
          description: 'div.second',
        },
      },
      {
        enumerable: true,
        value: {
          className: 'HTMLSpanElement',
          description: 'span.third',
        },
      },
    ],
  })
  mockCleanDetachedDomNodesWithStackTraces.mockImplementation(async (nodes) => nodes)
})

test('transfers repeated detached DOM stack traces once and reconstructs them', async () => {
  const detachedRoots = [
    {
      ___stackTrace: 'createDiv (workbench.js:1:2)\nrender (workbench.js:3:4)',
    },
    {
      ___stackTrace: 'createDiv (workbench.js:1:2)\nrender (workbench.js:3:4)',
    },
    {
      ___stackTrace: 'createSpan (workbench.js:5:6)',
    },
  ]
  let transferred: any
  mockCallFunctionOn.mockImplementation(async (_session, options) => {
    const getStackTraces = Function(`return (${options.functionDeclaration})`)()
    transferred = getStackTraces.call(detachedRoots)
    return transferred
  })

  const result = await GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces({} as any, 'object-group', Object.create(null))

  expect(transferred).toEqual({
    stackTraceIndexes: [0, 0, 1],
    stackTraces: ['createDiv (workbench.js:1:2)\nrender (workbench.js:3:4)', 'createSpan (workbench.js:5:6)'],
  })
  expect(result).toEqual([
    {
      className: 'HTMLDivElement',
      description: 'div.first',
      stackTrace: ['createDiv (workbench.js:1:2)', 'render (workbench.js:3:4)'],
    },
    {
      className: 'HTMLDivElement',
      description: 'div.second',
      stackTrace: ['createDiv (workbench.js:1:2)', 'render (workbench.js:3:4)'],
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.third',
      stackTrace: ['createSpan (workbench.js:5:6)'],
    },
  ])
})
