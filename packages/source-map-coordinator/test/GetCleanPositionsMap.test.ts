import { expect, jest, test } from '@jest/globals'

const invoke = jest.fn(async () => {
  return [
    {
      column: 2,
      line: 1,
      name: 'resolved',
      source: 'src/resolved.ts',
    },
  ]
})

jest.unstable_mockModule('../src/parts/LaunchSourceMapWorker/LaunchSourceMapWorker.ts', () => {
  return {
    launchSourceMapWorker: jest.fn(async () => {
      return {
        [Symbol.asyncDispose]: async () => {},
        invoke,
      }
    }),
  }
})

jest.unstable_mockModule('../src/parts/LoadSourceMap/LoadSourceMap.ts', () => {
  return {
    loadSourceMap: jest.fn(async (url: string) => {
      if (url === 'bad.js.map') {
        throw new Error('bad source map')
      }
      return {
        mappings: '',
        sources: [],
        version: 3,
      }
    }),
  }
})

const { getCleanPositionsMap } = await import('../src/parts/GetCleanPositionsMap/GetCleanPositionsMap.ts')

test('getCleanPositionsMap - resolves source maps independently', async () => {
  const result = await getCleanPositionsMap(
    {
      'bad.js.map': [1, 2, 3, 4],
      'good.js.map': [5, 6],
    },
    false,
  )

  expect(result['bad.js.map']).toEqual([undefined, undefined])
  expect(result['good.js.map']).toEqual([
    {
      column: 2,
      line: 1,
      name: 'resolved',
      source: 'src/resolved.ts',
      sourcesHash: undefined,
    },
  ])
})
