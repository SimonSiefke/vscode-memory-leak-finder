import { expect, test } from '@jest/globals'
import type { NodeVersionInfo } from '../src/parts/NodeVersionTypes/NodeVersionTypes.ts'
import { filterAndSortNodeVersions } from '../src/parts/FilterAndSortNodeVersions/FilterAndSortNodeVersions.ts'

test('filterAndSortNodeVersions - filters by major version', () => {
  const versions: readonly NodeVersionInfo[] = [
    { version: 'v22.21.0' },
    { version: 'v22.14.0' },
    { version: 'v21.5.0' },
    { version: 'v20.15.0' },
  ]

  const result = filterAndSortNodeVersions(versions, 22)

  expect(result).toHaveLength(2)
  expect(result[0].version).toBe('v22.21.0')
  expect(result[1].version).toBe('v22.14.0')
})

test('filterAndSortNodeVersions - sorts by version descending', () => {
  const versions: readonly NodeVersionInfo[] = [
    { version: 'v22.14.0' },
    { version: 'v22.21.0' },
    { version: 'v22.10.0' },
    { version: 'v22.20.0' },
  ]

  const result = filterAndSortNodeVersions(versions, 22)

  expect(result).toHaveLength(4)
  expect(result[0].version).toBe('v22.21.0')
  expect(result[1].version).toBe('v22.20.0')
  expect(result[2].version).toBe('v22.14.0')
  expect(result[3].version).toBe('v22.10.0')
})

test('filterAndSortNodeVersions - handles patch version sorting', () => {
  const versions: readonly NodeVersionInfo[] = [
    { version: 'v18.20.5' },
    { version: 'v18.20.4' },
    { version: 'v18.20.3' },
    { version: 'v18.20.10' },
  ]

  const result = filterAndSortNodeVersions(versions, 18)

  expect(result).toHaveLength(4)
  expect(result[0].version).toBe('v18.20.10')
  expect(result[1].version).toBe('v18.20.5')
  expect(result[2].version).toBe('v18.20.4')
  expect(result[3].version).toBe('v18.20.3')
})

test('filterAndSortNodeVersions - handles minor version sorting', () => {
  const versions: readonly NodeVersionInfo[] = [
    { version: 'v20.5.0' },
    { version: 'v20.15.0' },
    { version: 'v20.10.0' },
    { version: 'v20.1.0' },
  ]

  const result = filterAndSortNodeVersions(versions, 20)

  expect(result).toHaveLength(4)
  expect(result[0].version).toBe('v20.15.0')
  expect(result[1].version).toBe('v20.10.0')
  expect(result[2].version).toBe('v20.5.0')
  expect(result[3].version).toBe('v20.1.0')
})

test('filterAndSortNodeVersions - returns empty array when no matching versions', () => {
  const versions: readonly NodeVersionInfo[] = [{ version: 'v20.15.0' }, { version: 'v19.5.0' }, { version: 'v18.20.0' }]

  const result = filterAndSortNodeVersions(versions, 22)

  expect(result).toHaveLength(0)
})

test('filterAndSortNodeVersions - filters out invalid version formats', () => {
  const versions: readonly NodeVersionInfo[] = [
    { version: 'v22.21.0' },
    { version: 'invalid-version' },
    { version: 'v22.14.0' },
    { version: '22.10.0' },
  ]

  const result = filterAndSortNodeVersions(versions, 22)

  expect(result).toHaveLength(2)
  expect(result[0].version).toBe('v22.21.0')
  expect(result[1].version).toBe('v22.14.0')
})

test('filterAndSortNodeVersions - returns parsed version objects with correct properties', () => {
  const versions: readonly NodeVersionInfo[] = [{ version: 'v22.21.5' }]

  const result = filterAndSortNodeVersions(versions, 22)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    major: 22,
    minor: 21,
    patch: 5,
    version: 'v22.21.5',
  })
})
