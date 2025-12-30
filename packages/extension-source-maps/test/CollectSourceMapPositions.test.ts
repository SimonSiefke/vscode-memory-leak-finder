import { expect, test, beforeEach, jest } from '@jest/globals'

const mockParseSourceLocation = jest.fn()
const mockMapPathToSourceMapUrl = jest.fn()

jest.unstable_mockModule('../src/parts/ParseSourceLocation/ParseSourceLocation.ts', () => ({
  parseSourceLocation: mockParseSourceLocation,
}))

jest.unstable_mockModule('../src/parts/MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts', () => ({
  mapPathToSourceMapUrl: mockMapPathToSourceMapUrl,
}))

const { collectSourceMapPositions } = await import('../src/parts/CollectSourceMapPositions/CollectSourceMapPositions.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('collectSourceMapPositions - collects positions from items with sourceMapUrl', () => {
  const enriched: any[] = [
    { column: 20, line: 10, sourceMapUrl: 'file:///path/to/source.map' },
    { column: 25, line: 15, sourceMapUrl: 'file:///path/to/source.map' },
  ]
  const rootPath = '/root'

  const result = collectSourceMapPositions(enriched, rootPath)

  expect(result.sourceMapUrlToPositions).toEqual({
    'file:///path/to/source.map': [10, 20, 15, 25],
  })
  expect(result.positionPointers).toHaveLength(2)
  expect(result.positionPointers[0]).toEqual({ index: 0, sourceMapUrl: 'file:///path/to/source.map' })
  expect(result.positionPointers[1]).toEqual({ index: 1, sourceMapUrl: 'file:///path/to/source.map' })
})

test('collectSourceMapPositions - collects positions from items with sourceLocation', () => {
  mockParseSourceLocation.mockReturnValue({ column: 10, line: 5, url: 'path/to/file.js' })
  mockMapPathToSourceMapUrl.mockReturnValue('file:///path/to/source.map')

  const enriched: any[] = [{ sourceLocation: 'path/to/file.js:5:10' }]
  const rootPath = '/root'

  const result = collectSourceMapPositions(enriched, rootPath)

  expect(mockParseSourceLocation).toHaveBeenCalledWith('path/to/file.js:5:10')
  expect(mockMapPathToSourceMapUrl).toHaveBeenCalledWith('path/to/file.js', '/root')
  expect(result.sourceMapUrlToPositions).toEqual({
    'file:///path/to/source.map': [5, 10],
  })
  expect(enriched[0].sourceMapUrl).toBe('file:///path/to/source.map')
})

test('collectSourceMapPositions - collects positions from items with url', () => {
  mockMapPathToSourceMapUrl.mockReturnValue('file:///path/to/source.map')

  const enriched: any[] = [{ column: 7, line: 3, url: 'path/to/file.js' }]
  const rootPath = '/root'

  const result = collectSourceMapPositions(enriched, rootPath)

  expect(mockMapPathToSourceMapUrl).toHaveBeenCalledWith('path/to/file.js', '/root')
  expect(result.sourceMapUrlToPositions).toEqual({
    'file:///path/to/source.map': [3, 7],
  })
  expect(enriched[0].sourceMapUrl).toBe('file:///path/to/source.map')
})

test('collectSourceMapPositions - skips items without valid source map URL', () => {
  mockMapPathToSourceMapUrl.mockReturnValue(null)

  const enriched: any[] = [
    { column: 7, line: 3, url: 'path/to/file.js' },
    { column: 10, line: 5 }, // missing url and sourceLocation
  ]
  const rootPath = '/root'

  const result = collectSourceMapPositions(enriched, rootPath)

  expect(result.sourceMapUrlToPositions).toEqual({})
  expect(result.positionPointers).toHaveLength(0)
})

test('collectSourceMapPositions - skips items without line or column', () => {
  const enriched: any[] = [
    { line: 10, sourceMapUrl: 'file:///path/to/source.map' }, // missing column
    { column: 20, sourceMapUrl: 'file:///path/to/source.map' }, // missing line
  ]
  const rootPath = '/root'

  const result = collectSourceMapPositions(enriched, rootPath)

  expect(result.sourceMapUrlToPositions).toEqual({})
  expect(result.positionPointers).toHaveLength(0)
})
