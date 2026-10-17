import { expect, test } from '@jest/globals'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'
import { getDuplicateObjectGraphs } from '../src/parts/GetDuplicateObjectGraphs/GetDuplicateObjectGraphs.ts'

const fixture = () => {
  const strings: string[] = []
  const str = (value: string) => {
    let index = strings.indexOf(value)
    if (index < 0) {
      index = strings.length
      strings.push(value)
    }
    return index
  }
  const entries: { name: string; type: string; size: number; edges: { type: string; key: string; target: number }[] }[] = []
  const node = (name: string, type = 'hidden', size = 0) => {
    entries.push({ name, type, size, edges: [] })
    return entries.length - 1
  }
  const edge = (from: number, key: string, target: number, type = 'internal') => entries[from].edges.push({ key, target, type })
  node('(root)', 'synthetic')
  const prototype = node('Object.prototype', 'object')
  const map = node('system / Map', 'object shape')
  edge(map, 'prototype', prototype)
  const object = (properties: Record<string, number> = {}, size = 32, ownPrototype = prototype) => {
    const index = node('Object', 'object', size)
    let ownMap = map
    if (ownPrototype !== prototype) {
      ownMap = node('system / Map', 'object shape')
      edge(ownMap, 'prototype', ownPrototype)
    }
    edge(index, 'map', ownMap)
    edge(index, '__proto__', ownPrototype, 'property')
    for (const [key, target] of Object.entries(properties)) edge(index, key, target, 'property')
    return index
  }
  const number = (value: string | number, kind = 'smi number') => {
    const index = node(kind, 'number')
    edge(index, 'value', node(String(value), 'string'))
    return index
  }
  const text = (value: string) => node(value, 'string')
  const id = (ordinal: number) => ordinal * 2 + 1
  const build = (): Snapshot => {
    const nodeTypes = [
      'synthetic',
      'object',
      'hidden',
      'number',
      'string',
      'symbol',
      'closure',
      'array',
      'bigint',
      'object shape',
      'concatenated string',
    ]
    const edgeTypes = ['property', 'internal', 'element', 'weak']
    return {
      node_count: entries.length,
      edge_count: entries.reduce((count, entry) => count + entry.edges.length, 0),
      extra_native_bytes: 0,
      locations: new Uint32Array(),
      meta: {
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
        node_types: [nodeTypes],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [edgeTypes],
        location_fields: [],
      },
      nodes: Uint32Array.from(
        entries.flatMap((entry, index) => [nodeTypes.indexOf(entry.type), str(entry.name), id(index), entry.size, entry.edges.length]),
      ),
      edges: Uint32Array.from(
        entries.flatMap((entry) => entry.edges.flatMap((edge) => [edgeTypes.indexOf(edge.type), str(edge.key), edge.target * 5])),
      ),
      strings,
    }
  }
  return { node, edge, object, number, text, prototype, id, build }
}

const containsGroup = (report: ReturnType<typeof getDuplicateObjectGraphs>, ids: number[]) =>
  report.groups.some((group) => ids.every((id) => group.exampleNodeIds.includes(id)))

test('groups values, ignores property insertion order and ranks redundant shallow bytes', () => {
  const f = fixture()
  const a = f.object({ x: f.number(1), text: f.text('same') }, 40)
  const b = f.object({ text: f.text('same'), x: f.number(1) }, 32)
  f.object({ x: f.number(2), text: f.text('same') })
  const c = f.object({ y: f.number(3) }, 64)
  const d = f.object({ y: f.number(3) }, 64)
  const report = getDuplicateObjectGraphs(f.build())
  expect(report.complete).toBe(true)
  expect(report.duplicateBytes).toBe(104)
  expect(report.duplicateObjects).toBe(2)
  expect(report.groups.map((group) => group.duplicateBytes)).toEqual([64, 40])
  expect(containsGroup(report, [f.id(a), f.id(b)])).toBe(true)
  expect(containsGroup(report, [f.id(c), f.id(d)])).toBe(true)
  expect(report.groups[1].representativeNodeId).toBe(f.id(b))
})

test('compares nested graphs and preserves prototypes', () => {
  const f = fixture()
  const a = f.object({ nested: f.object({ value: f.number(7) }) })
  const b = f.object({ nested: f.object({ value: f.number(7) }) })
  const c = f.object({ nested: f.object({ value: f.number(7) }) }, 32, f.node('other prototype', 'object'))
  const report = getDuplicateObjectGraphs(f.build())
  expect(containsGroup(report, [f.id(a), f.id(b)])).toBe(true)
  expect(containsGroup(report, [f.id(a), f.id(c)])).toBe(false)
})

test('hash matches cannot conflate shared children with separate copies', () => {
  const f = fixture()
  const shared = f.object()
  const a = f.object({ left: shared, right: shared })
  const b = f.object({ left: f.object(), right: f.object() })
  const c = f.object({ left: shared, right: shared })
  const report = getDuplicateObjectGraphs(f.build())
  expect(containsGroup(report, [f.id(a), f.id(c)])).toBe(true)
  expect(containsGroup(report, [f.id(a), f.id(b)])).toBe(false)
})

test('checks descendants even when a child node is physically shared between roots', () => {
  const f = fixture()
  const leaf = f.object()
  const shared = f.object({ child: leaf })
  const a = f.object({ a: shared, b: leaf })
  const b = f.object({ a: shared, b: f.object() })
  expect(containsGroup(getDuplicateObjectGraphs(f.build()), [f.id(a), f.id(b)])).toBe(false)
})

test('verifies cyclic hash collisions with a bijection, distinguishing self cycles from two-node rings', () => {
  const f = fixture()
  const a = f.object()
  const b = f.object()
  const c = f.object()
  const d = f.object()
  f.edge(a, 'next', a, 'property')
  f.edge(b, 'next', b, 'property')
  f.edge(c, 'next', d, 'property')
  f.edge(d, 'next', c, 'property')
  const report = getDuplicateObjectGraphs(f.build())
  expect(report.groups).toHaveLength(2)
  expect(report.groups[0].fingerprint).toBe(report.groups[1].fingerprint)
  expect(containsGroup(report, [f.id(a), f.id(b)])).toBe(true)
  expect(containsGroup(report, [f.id(c), f.id(d)])).toBe(true)
  expect(containsGroup(report, [f.id(a), f.id(c)])).toBe(false)
})

test.each([
  ['symbol', 'same description'],
  ['object', 'WeakMap'],
  ['object', 'WeakSet'],
  ['object', 'Array'],
  ['object', 'Map'],
  ['object', 'Date'],
  ['closure', 'callback'],
  ['bigint', 'bigint'],
])('opaque %s %s values match only by identity', (type, name) => {
  const f = fixture()
  const first = f.node(name, type)
  const second = f.node(name, type)
  const a = f.object({ value: first })
  const b = f.object({ value: second })
  const c = f.object({ value: first })
  const report = getDuplicateObjectGraphs(f.build())
  expect(containsGroup(report, [f.id(a), f.id(c)])).toBe(true)
  expect(containsGroup(report, [f.id(a), f.id(b)])).toBe(false)
  expect(report.groups[0].preview.value).toContain(String(f.id(first)))
})

test('does not equate unknown numeric values, ambiguous zero, ropes or truncated strings by display names', () => {
  const f = fixture()
  for (const targets of [
    [f.node('heap number', 'number'), f.node('heap number', 'number')],
    [f.number(0, 'heap number'), f.number(0, 'heap number')],
    [f.text('x'.repeat(1024)), f.text('x'.repeat(1024))],
    [f.node('(concatenated string)', 'concatenated string'), f.node('(concatenated string)', 'concatenated string')],
  ]) {
    f.object({ value: targets[0] })
    f.object({ value: targets[1] })
  }
  expect(getDuplicateObjectGraphs(f.build()).groups).toHaveLength(0)
})

test('ambiguous symbol keys, accessor pairs and indexed storage stay opaque', () => {
  const f = fixture()
  const children = [
    () => f.object({ '<symbol same>': f.number(1) }),
    () => f.object({ value: f.node('system / AccessorPair') }),
    () => {
      const object = f.object()
      f.edge(object, 'elements', f.node('(object elements)', 'array'))
      return object
    },
  ]
  for (const child of children) {
    const a = f.object({ child: child() })
    const b = f.object({ child: child() })
    expect(containsGroup(getDuplicateObjectGraphs(f.build()), [f.id(a), f.id(b)])).toBe(false)
  }
})

test('handles deeply nested acyclic objects without recursion', () => {
  const f = fixture()
  let child = f.object({ end: f.number(1) })
  for (let index = 0; index < 12000; index++) child = f.object({ child })
  const report = getDuplicateObjectGraphs(f.build())
  expect(report.complete).toBe(true)
  expect(report.statistics.analyzedObjects).toBe(12001)
  expect(report.groups).toHaveLength(0)
})

test('limits verification work and explicitly marks totals incomplete', () => {
  const f = fixture()
  for (let index = 0; index < 100; index++) f.object({ x: f.number(1) })
  const report = getDuplicateObjectGraphs(f.build(), { maxComparisonWork: 10 })
  expect(report.complete).toBe(false)
  expect(report.statistics.unverifiedObjects).toBeGreaterThan(0)
  expect(report.statistics.comparisonWork).toBeLessThanOrEqual(11)
  expect(getDuplicateObjectGraphs(f.build(), { maxObjects: 2 }).complete).toBe(false)
})

test('bounds report examples when thousands of objects are identical', () => {
  const f = fixture()
  const value = f.number(1)
  for (let index = 0; index < 5000; index++) f.object({ x: value })
  const report = getDuplicateObjectGraphs(f.build())
  expect(report.complete).toBe(true)
  expect(report.duplicateObjects).toBe(4999)
  expect(report.duplicateBytes).toBe(4999 * 32)
  expect(report.groups[0].exampleNodeIds).toHaveLength(8)
  expect(JSON.stringify(report).length).toBeLessThan(3000)
})

test('does not erase an own __proto__ property pointing at the actual prototype', () => {
  const f = fixture()
  const normal = f.object({ x: f.number(1) })
  const shadow = f.object(
    Object.fromEntries([
      ['x', f.number(1)],
      ['__proto__', f.prototype],
    ]),
  )
  expect(containsGroup(getDuplicateObjectGraphs(f.build()), [f.id(normal), f.id(shadow)])).toBe(false)
})
