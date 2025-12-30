import { expect, test, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

const mockLaunchSourceMapWorker = jest.fn()

jest.unstable_mockModule('../src/parts/LaunchSourceMapWorker/LaunchSourceMapWorker.ts', () => ({
  launchSourceMapWorker: mockLaunchSourceMapWorker,
}))

const { resolveOriginalPositions } = await import('../src/parts/ResolveOriginalPositions/ResolveOriginalPositions.ts')

test('resolveOriginalPositions - enriches items with original positions', async () => {
  const enriched = [{ name: 'test1' }, { name: 'test2' }]
  const sourceMapUrlToPositions = {
    'file:///path/to/source.map': [10, 20, 15, 25],
  }
  const positionPointers = [
    { index: 0, sourceMapUrl: 'file:///path/to/source.map' },
    { index: 1, sourceMapUrl: 'file:///path/to/source.map' },
  ]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          'file:///path/to/source.map': [
            { column: 5, line: 1, name: 'testFunction1', source: 'src/index.ts' },
            { column: 10, line: 2, name: 'testFunction2', source: 'src/utils.ts' },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  await resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

  expect(enriched[0]).toMatchObject({
    name: 'test1',
    originalColumn: 5,
    originalLine: 1,
    originalLocation: 'src/index.ts:1:5',
    originalName: 'testFunction1',
    originalSource: 'src/index.ts',
    originalUrl: 'src/index.ts',
  })

  expect(enriched[1]).toMatchObject({
    name: 'test2',
    originalColumn: 10,
    originalLine: 2,
    originalLocation: 'src/utils.ts:2:10',
    originalName: 'testFunction2',
    originalSource: 'src/utils.ts',
    originalUrl: 'src/utils.ts',
  })
})

test('resolveOriginalPositions - handles missing original positions gracefully', async () => {
  const enriched = [{ name: 'test1' }]
  const sourceMapUrlToPositions = {
    'file:///path/to/source.map': [10, 20],
  }
  const positionPointers = [{ index: 0, sourceMapUrl: 'file:///path/to/source.map' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => {
      return {
        'file:///path/to/source.map': [],
      }
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  await resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

  expect(enriched[0]).toEqual({ name: 'test1' })
})

test('resolveOriginalPositions - handles errors gracefully', async () => {
  const enriched = [{ name: 'test1' }]
  const sourceMapUrlToPositions = {
    'file:///path/to/source.map': [10, 20],
  }
  const positionPointers = [{ index: 0, sourceMapUrl: 'file:///path/to/source.map' }]

  mockLaunchSourceMapWorker.mockImplementation(async () => {
    throw new Error('RPC error')
  })

  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  try {
    await resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

    expect(consoleSpy).toHaveBeenCalled()
    expect(enriched[0]).toEqual({ name: 'test1' })
  } finally {
    consoleSpy.mockRestore()
  }
})

test('resolveOriginalPositions - handles null original values', async () => {
  const enriched = [{ name: 'test1' }]
  const sourceMapUrlToPositions = {
    'file:///path/to/source.map': [10, 20],
  }
  const positionPointers = [{ index: 0, sourceMapUrl: 'file:///path/to/source.map' }]

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => {
      return {
        'file:///path/to/source.map': [{ column: null, line: null, name: null, source: null }],
      }
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  await resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

  expect(enriched[0]).toMatchObject({
    name: 'test1',
    originalColumn: null,
    originalLine: null,
    originalName: null,
    originalSource: null,
    originalUrl: null,
  })
  expect((enriched[0] as any).originalLocation).toBeUndefined()
})
