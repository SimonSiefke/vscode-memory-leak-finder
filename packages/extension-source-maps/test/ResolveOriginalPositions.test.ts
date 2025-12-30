import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as ResolveOriginalPositions from '../src/parts/ResolveOriginalPositions/ResolveOriginalPositions.ts'
import * as LaunchSourceMapWorker from '../src/parts/LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

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
        return Promise.resolve({
          'file:///path/to/source.map': [
            { source: 'src/index.ts', line: 1, column: 5, name: 'testFunction1' },
            { source: 'src/utils.ts', line: 2, column: 10, name: 'testFunction2' },
          ],
        })
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  const originalLaunch = LaunchSourceMapWorker.launchSourceMapWorker
  ;(LaunchSourceMapWorker as any).launchSourceMapWorker = async () => {
    return mockRpc
  }

  try {
    await ResolveOriginalPositions.resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

    expect(enriched[0]).toMatchObject({
      name: 'test1',
      originalSource: 'src/index.ts',
      originalUrl: 'src/index.ts',
      originalLine: 1,
      originalColumn: 5,
      originalName: 'testFunction1',
      originalLocation: 'src/index.ts:1:5',
    })

    expect(enriched[1]).toMatchObject({
      name: 'test2',
      originalSource: 'src/utils.ts',
      originalUrl: 'src/utils.ts',
      originalLine: 2,
      originalColumn: 10,
      originalName: 'testFunction2',
      originalLocation: 'src/utils.ts:2:10',
    })
  } finally {
    ;(LaunchSourceMapWorker as any).launchSourceMapWorker = originalLaunch
  }
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
      return Promise.resolve({
        'file:///path/to/source.map': [],
      })
    },
  })

  const originalLaunch = LaunchSourceMapWorker.launchSourceMapWorker
  ;(LaunchSourceMapWorker as any).launchSourceMapWorker = async () => {
    return mockRpc
  }

  try {
    await ResolveOriginalPositions.resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

    expect(enriched[0]).toEqual({ name: 'test1' })
  } finally {
    ;(LaunchSourceMapWorker as any).launchSourceMapWorker = originalLaunch
  }
})

test('resolveOriginalPositions - handles errors gracefully', async () => {
  const enriched = [{ name: 'test1' }]
  const sourceMapUrlToPositions = {
    'file:///path/to/source.map': [10, 20],
  }
  const positionPointers = [{ index: 0, sourceMapUrl: 'file:///path/to/source.map' }]

  const originalLaunch = LaunchSourceMapWorker.launchSourceMapWorker
  ;(LaunchSourceMapWorker as any).launchSourceMapWorker = async () => {
    throw new Error('RPC error')
  }

  const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

  try {
    await ResolveOriginalPositions.resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

    expect(consoleSpy).toHaveBeenCalled()
    expect(enriched[0]).toEqual({ name: 'test1' })
  } finally {
    ;(LaunchSourceMapWorker as any).launchSourceMapWorker = originalLaunch
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
      return Promise.resolve({
        'file:///path/to/source.map': [{ source: null, line: null, column: null, name: null }],
      })
    },
  })

  const originalLaunch = LaunchSourceMapWorker.launchSourceMapWorker
  ;(LaunchSourceMapWorker as any).launchSourceMapWorker = async () => {
    return mockRpc
  }

  try {
    await ResolveOriginalPositions.resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

    expect(enriched[0]).toMatchObject({
      name: 'test1',
      originalSource: null,
      originalUrl: null,
      originalLine: null,
      originalColumn: null,
      originalName: null,
    })
    expect(enriched[0].originalLocation).toBeUndefined()
  } finally {
    ;(LaunchSourceMapWorker as any).launchSourceMapWorker = originalLaunch
  }
})
