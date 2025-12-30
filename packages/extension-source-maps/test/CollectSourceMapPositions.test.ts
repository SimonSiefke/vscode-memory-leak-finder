import { expect, test, beforeEach } from '@jest/globals'
import * as CollectSourceMapPositions from '../src/parts/CollectSourceMapPositions/CollectSourceMapPositions.ts'
import * as MapPathToSourceMapUrl from '../src/parts/MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as ParseSourceLocation from '../src/parts/ParseSourceLocation/ParseSourceLocation.ts'

// Mock the dependencies
jest.mock('../src/parts/MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts')
jest.mock('../src/parts/ParseSourceLocation/ParseSourceLocation.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('collectSourceMapPositions - collects positions from items with sourceMapUrl', () => {
  const enriched = [
    { sourceMapUrl: 'file:///path/to/source.map', line: 10, column: 20 },
    { sourceMapUrl: 'file:///path/to/source.map', line: 15, column: 25 },
  ]
  const rootPath = '/root'

  const result = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

  expect(result.sourceMapUrlToPositions).toEqual({
    'file:///path/to/source.map': [10, 20, 15, 25],
  })
  expect(result.positionPointers).toHaveLength(2)
  expect(result.positionPointers[0]).toEqual({ index: 0, sourceMapUrl: 'file:///path/to/source.map' })
  expect(result.positionPointers[1]).toEqual({ index: 1, sourceMapUrl: 'file:///path/to/source.map' })
})

test('collectSourceMapPositions - collects positions from items with sourceLocation', () => {
  const mockParse = ParseSourceLocation.parseSourceLocation as jest.Mock
  const mockMapPath = MapPathToSourceMapUrl.mapPathToSourceMapUrl as jest.Mock

  mockParse.mockReturnValue({ url: 'path/to/file.js', line: 5, column: 10 })
  mockMapPath.mockReturnValue('file:///path/to/source.map')

  const enriched = [{ sourceLocation: 'path/to/file.js:5:10' }]
  const rootPath = '/root'

  const result = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

  expect(mockParse).toHaveBeenCalledWith('path/to/file.js:5:10')
  expect(mockMapPath).toHaveBeenCalledWith('path/to/file.js', '/root')
  expect(result.sourceMapUrlToPositions).toEqual({
    'file:///path/to/source.map': [5, 10],
  })
  expect(enriched[0].sourceMapUrl).toBe('file:///path/to/source.map')
})

test('collectSourceMapPositions - collects positions from items with url', () => {
  const mockMapPath = MapPathToSourceMapUrl.mapPathToSourceMapUrl as jest.Mock
  mockMapPath.mockReturnValue('file:///path/to/source.map')

  const enriched = [{ url: 'path/to/file.js', line: 3, column: 7 }]
  const rootPath = '/root'

  const result = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

  expect(mockMapPath).toHaveBeenCalledWith('path/to/file.js', '/root')
  expect(result.sourceMapUrlToPositions).toEqual({
    'file:///path/to/source.map': [3, 7],
  })
  expect(enriched[0].sourceMapUrl).toBe('file:///path/to/source.map')
})

test('collectSourceMapPositions - skips items without valid source map URL', () => {
  const mockMapPath = MapPathToSourceMapUrl.mapPathToSourceMapUrl as jest.Mock
  mockMapPath.mockReturnValue(null)

  const enriched = [
    { url: 'path/to/file.js', line: 3, column: 7 },
    { line: 5, column: 10 }, // missing url and sourceLocation
  ]
  const rootPath = '/root'

  const result = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

  expect(result.sourceMapUrlToPositions).toEqual({})
  expect(result.positionPointers).toHaveLength(0)
})

test('collectSourceMapPositions - skips items without line or column', () => {
  const enriched = [
    { sourceMapUrl: 'file:///path/to/source.map', line: 10 }, // missing column
    { sourceMapUrl: 'file:///path/to/source.map', column: 20 }, // missing line
  ]
  const rootPath = '/root'

  const result = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

  expect(result.sourceMapUrlToPositions).toEqual({})
  expect(result.positionPointers).toHaveLength(0)
})
