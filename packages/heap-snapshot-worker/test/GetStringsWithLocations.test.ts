import { expect, test } from '@jest/globals'
import { getStringsWithLocations } from '../src/parts/GetStringsWithLocations/GetStringsWithLocations.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

interface TestNode {
  readonly type: string
  readonly value?: string
  readonly location?: readonly [number, number, number]
  readonly edges?: readonly { target: number; type?: string; name?: string }[]
}

const createSnapshot = (records: readonly TestNode[], reordered = false): Snapshot => {
  const types = ['synthetic', 'closure', 'hidden', 'object', 'string', 'concatenated string', 'sliced string', 'code']
  const edgeTypes = ['property', 'context', 'internal', 'element', 'weak', 'shortcut']
  const fields = reordered ? ['id', 'name', 'self_size', 'edge_count', 'type'] : ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = reordered ? ['to_node', 'name_or_index', 'type'] : ['type', 'name_or_index', 'to_node']
  const locationFields = reordered ? ['column', 'script_id', 'object_index', 'line'] : ['object_index', 'script_id', 'line', 'column']
  const strings: string[] = []
  const intern = (value: string) => {
    let index = strings.indexOf(value)
    if (index < 0) {
      index = strings.length
      strings.push(value)
    }
    return index
  }
  const nodes: number[] = []
  const edges: number[] = []
  const locations: number[] = []
  for (let ordinal = 0; ordinal < records.length; ordinal++) {
    const record = records[ordinal]
    const values: Record<string, number> = {
      type: types.indexOf(record.type),
      name: intern(record.value ?? `(${record.type})`),
      id: ordinal * 2 + 1,
      self_size: 32,
      edge_count: record.edges?.length ?? 0,
    }
    nodes.push(...fields.map((field) => values[field]))
    for (const edge of record.edges ?? []) {
      const values: Record<string, number> = {
        type: edgeTypes.indexOf(edge.type ?? 'property'),
        name_or_index: intern(edge.name ?? 'value'),
        to_node: edge.target * fields.length,
      }
      edges.push(...edgeFields.map((field) => values[field]))
    }
    if (record.location) {
      const [scriptId, line, column] = record.location
      const values: Record<string, number> = { object_index: ordinal * fields.length, script_id: scriptId, line, column }
      locations.push(...locationFields.map((field) => values[field]))
    }
  }
  return {
    node_count: records.length,
    edge_count: edges.length / edgeFields.length,
    nodes: new Uint32Array(nodes),
    edges: new Uint32Array(edges),
    strings,
    locations: new Uint32Array(locations),
    extra_native_bytes: 0,
    meta: {
      node_fields: fields,
      node_types: fields.map((field) => (field === 'type' ? types : [])),
      edge_fields: edgeFields,
      edge_types: edgeFields.map((field) => (field === 'type' ? edgeTypes : [])),
      location_fields: locationFields,
    },
  }
}

const scripts = { '7': { url: 'file:///owner.js' }, '8': { url: 'file:///other.js' } }

test.each([false, true])('finds the nearest retaining location through contexts and cyclic containers (reordered: %s)', (reordered) => {
  const snapshot = createSnapshot(
    [
      { type: 'synthetic', edges: [{ target: 1 }, { target: 2 }] },
      { type: 'closure', location: [8, 10, 2], edges: [{ target: 3, type: 'internal', name: 'context' }] },
      { type: 'closure', location: [7, 20, 4], edges: [{ target: 4, type: 'internal', name: 'context' }] },
      { type: 'hidden', edges: [{ target: 5 }, { target: 6 }] },
      { type: 'hidden', edges: [{ target: 6 }] },
      { type: 'object', edges: [{ target: 6 }, { target: 3 }] },
      { type: 'string', value: 'output' },
    ],
    reordered,
  )
  // owner.js reaches the string in two edges; other.js also has a two-edge path.
  expect(getStringsWithLocations(snapshot, scripts)).toEqual([{ string: 'output', sourceLocation: 'file:///other.js:11:3', count: 1 }])
})

test('prefers a closer location over an alphabetically earlier but more distant closure', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }, { target: 2 }] },
    { type: 'closure', location: [8, 1, 0], edges: [{ target: 5 }] },
    { type: 'closure', location: [7, 1, 0], edges: [{ target: 3 }] },
    { type: 'object', edges: [{ target: 4 }] },
    { type: 'object', edges: [{ target: 5 }] },
    { type: 'string', value: 'output' },
  ])
  expect(getStringsWithLocations(snapshot, scripts)[0].sourceLocation).toBe('file:///other.js:2:1')
})

test('groups equal string objects per location, without counting repeated references', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }, { target: 2 }] },
    { type: 'closure', location: [7, 1, 0], edges: [{ target: 3 }, { target: 3 }, { target: 4 }] },
    { type: 'closure', location: [8, 2, 0], edges: [{ target: 5 }] },
    { type: 'string', value: 'same' },
    { type: 'string', value: 'same' },
    { type: 'string', value: 'same' },
  ])
  expect(getStringsWithLocations(snapshot, scripts)).toEqual([
    { string: 'same', sourceLocation: 'file:///owner.js:2:1', count: 2 },
    { string: 'same', sourceLocation: 'file:///other.js:3:1', count: 1 },
  ])
})

test('keeps unknown locations and excludes weak-only strings and metadata attribution paths', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }, { target: 2 }, { target: 3 }, { target: 4 }, { target: 5 }] },
    {
      type: 'closure',
      location: [7, 1, 0],
      edges: [
        { target: 2, type: 'weak' },
        { target: 3, type: 'internal', name: 'shared' },
        { target: 4, name: 'prototype' },
        { target: 5, type: 'shortcut' },
        { target: 6, type: 'weak' },
      ],
    },
    { type: 'string', value: 'weak reference' },
    { type: 'string', value: 'metadata' },
    { type: 'string', value: 'prototype' },
    { type: 'string', value: 'shortcut' },
    { type: 'string', value: 'weak only' },
  ])
  expect(getStringsWithLocations(snapshot, scripts)).toEqual(
    ['weak reference', 'metadata', 'prototype', 'shortcut'].map((string) => ({ string, sourceLocation: null, count: 1 })),
  )
})

test('uses a located top-level container and falls back to a script ID when no URL is known', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }] },
    { type: 'hidden', location: [99, 0, 0], edges: [{ target: 2, type: 'context' }] },
    { type: 'string', value: 'top level' },
  ])
  expect(getStringsWithLocations(snapshot, {})).toEqual([{ string: 'top level', sourceLocation: '99:1:1', count: 1 }])
})

test('reconstructs ropes and does not merge unrelated unavailable slices', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }] },
    { type: 'closure', location: [7, 0, 0], edges: [{ target: 2 }, { target: 3 }, { target: 6 }, { target: 7 }, { target: 8 }] },
    {
      type: 'concatenated string',
      edges: [
        { target: 4, type: 'internal', name: 'first' },
        { target: 5, type: 'internal', name: 'second' },
      ],
    },
    { type: 'string', value: 'hello world' },
    { type: 'string', value: 'hello ' },
    { type: 'string', value: 'world' },
    { type: 'sliced string', edges: [{ target: 3, type: 'internal', name: 'parent' }] },
    { type: 'sliced string', edges: [{ target: 3, type: 'internal', name: 'parent' }] },
    {
      type: 'concatenated string',
      edges: [
        { target: 8, type: 'internal', name: 'first' },
        { target: 5, type: 'internal', name: 'second' },
      ],
    },
  ])
  const groups = getStringsWithLocations(snapshot, scripts)
  expect(groups).toContainEqual({ string: 'hello world', sourceLocation: 'file:///owner.js:1:1', count: 2 })
  expect(groups.filter((group) => group.string === null)).toEqual([
    { string: null, sourceLocation: 'file:///owner.js:1:1', count: 1, heapObjectId: '13', stringType: 'sliced string' },
    { string: null, sourceLocation: 'file:///owner.js:1:1', count: 1, heapObjectId: '15', stringType: 'sliced string' },
    { string: null, sourceLocation: 'file:///owner.js:1:1', count: 1, heapObjectId: '17', stringType: 'concatenated string' },
  ])
})

test('handles empty snapshots and deep retaining chains without recursive traversal', () => {
  expect(getStringsWithLocations(createSnapshot([]), {})).toEqual([])
  const records: TestNode[] = [
    { type: 'synthetic', edges: [{ target: 1 }] },
    { type: 'closure', location: [7, 0, 0], edges: [{ target: 2 }] },
  ]
  for (let index = 2; index < 10_000; index++) records.push({ type: 'object', edges: [{ target: index + 1 }] })
  records.push({ type: 'string', value: 'deep' })
  expect(getStringsWithLocations(createSnapshot(records), scripts)).toEqual([
    { string: 'deep', sourceLocation: 'file:///owner.js:1:1', count: 1 },
  ])
})

test('keeps an over-limit reconstructed rope explicit instead of grouping a truncated preview', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }] },
    { type: 'closure', location: [7, 0, 0], edges: [{ target: 2 }] },
    {
      type: 'concatenated string',
      edges: [
        { target: 3, type: 'internal', name: 'first' },
        { target: 4, type: 'internal', name: 'second' },
      ],
    },
    { type: 'string', value: 'x'.repeat(64 * 1024) },
    { type: 'string', value: 'tail' },
  ])
  expect(getStringsWithLocations(snapshot, scripts)).toContainEqual({
    string: null,
    sourceLocation: 'file:///owner.js:1:1',
    count: 1,
    heapObjectId: '5',
    stringType: 'concatenated string',
  })
})

test('attributes console-retained stack strings and rope fragments to an explicitly marked stack frame', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }] },
    {
      type: 'concatenated string',
      edges: [
        { target: 2, type: 'internal', name: 'first' },
        { target: 3, type: 'internal', name: 'second' },
      ],
    },
    { type: 'string', value: 'Error: leaked disposable\n    at trackDisposable (file:///owner.js:20:5)' },
    { type: 'string', value: '\n    at handler (file:///other.js:30:7)' },
  ])
  const groups = getStringsWithLocations(snapshot, scripts)
  expect(groups).toHaveLength(3)
  expect(
    groups.every(
      (group) => group.sourceLocation === 'file:///owner.js:20:5' && 'locationKind' in group && group.locationKind === 'stack-frame',
    ),
  ).toBe(true)
})

test('prefers actual retaining locations over locations embedded in stack text', () => {
  const snapshot = createSnapshot([
    { type: 'synthetic', edges: [{ target: 1 }] },
    { type: 'closure', location: [7, 0, 0], edges: [{ target: 2 }] },
    { type: 'string', value: 'Error\n    at handler (file:///other.js:30:7)' },
  ])
  expect(getStringsWithLocations(snapshot, scripts)).toEqual([
    { string: 'Error\n    at handler (file:///other.js:30:7)', sourceLocation: 'file:///owner.js:1:1', count: 1 },
  ])
})

test.each([
  ['[LEAKED DISPOSABLE] Error: CREATED via:', '\n', 'vscode-file://vscode-app/out/owner.js:16:19'],
  ['TypeError: failed', '\\n', 'https://example.com/owner.js:42:3'],
  ['Error', '\n', 'node:internal/example:12:4'],
  ['Error', '\n', 'C:\\project\\owner.js:12:4'],
])('extracts a fallback from %s with separator %j and source %s', (header, separator, location) => {
  const string = `${header}${separator}    at trackDisposable (${location})`
  const groups = getStringsWithLocations(
    createSnapshot([
      { type: 'synthetic', edges: [{ target: 1 }] },
      { type: 'string', value: string },
    ]),
    {},
  )
  expect(groups).toEqual([{ string, sourceLocation: location, locationKind: 'stack-frame', count: 1 }])
})

test('does not infer locations from detached frames or ordinary URL text', () => {
  const groups = getStringsWithLocations(
    createSnapshot([
      { type: 'synthetic', edges: [{ target: 1 }, { target: 2 }] },
      { type: 'string', value: '\n    at trackDisposable (file:///owner.js:20:5)' },
      { type: 'string', value: 'A link: file:///owner.js:20:5' },
    ]),
    {},
  )
  expect(groups.every((group) => group.sourceLocation === null)).toBe(true)
})
