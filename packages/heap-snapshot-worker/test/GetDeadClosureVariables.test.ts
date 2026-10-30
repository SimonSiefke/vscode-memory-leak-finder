import { expect, test } from '@jest/globals'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HeapSnapshot } from '../src/parts/ClosureContextSnapshot/ClosureContextSnapshot.ts'
import { getDeadClosureVariables } from '../src/parts/GetDeadClosureVariables/GetDeadClosureVariables.ts'
import { compareDeadClosureVariables } from '../src/parts/CompareDeadClosureVariables/CompareDeadClosureVariables.ts'
import type { ClosureSnapshotProfile } from '../src/parts/ClosureContextSnapshot/ClosureContextSnapshot.ts'

const fixture = () => {
  const strings = ['']
  const stringId = (value: string) => {
    let index = strings.indexOf(value)
    if (index === -1) {
      index = strings.length
      strings.push(value)
    }
    return index
  }
  const types = ['synthetic', 'hidden', 'object', 'closure', 'number', 'string']
  const edgeTypes = ['internal', 'context', 'property', 'weak']
  const entries: { name: string; type: string; size: number; edges: [string, string, number][] }[] = []
  const node = (name: string, type = 'hidden', size = 0) => {
    entries.push({ name, type, size, edges: [] })
    return (entries.length - 1) * 5
  }
  const edge = (from: number, name: string, to: number, type = 'internal') => entries[from / 5].edges.push([type, name, to])
  const integer = (value: number) => {
    const index = node('int', 'number')
    edge(index, 'value', node(String(value), 'string'))
    return index
  }
  const root = node('(root)', 'synthetic')
  const script = node('system / Script / test.js')
  edge(root, 'script', script)
  const infos = node('infos')
  edge(script, 'infos', infos)
  const scopeInfo = (scopeId: number) => {
    const info = node('system / ScopeInfo')
    edge(info, 'scope_id', integer(scopeId))
    edge(infos, String(scopeId), info, 'weak')
    return info
  }
  const outerInfo = scopeInfo(10)
  edge(outerInfo, 'function_name', node('outer', 'string'))
  const shared = (scopeId: number) => {
    const info = node('system / SharedFunctionInfo')
    edge(info, 'script', script)
    edge(info, 'scope_id', integer(scopeId))
    edge(info, 'name_or_scope_info', scopeInfo(scopeId))
    edge(infos, String(info), info, 'weak')
    return info
  }
  const keepShared = shared(30)
  const readerShared = shared(20)
  const context = () => {
    const index = node('system / Context / scope @123')
    edge(index, 'scope_info', outerInfo)
    return index
  }
  const closure = (name: string, context: number, info = keepShared) => {
    const index = node(name, 'closure', 16)
    edge(root, name, index)
    edge(index, 'context', context)
    edge(index, 'shared', info)
    return index
  }
  // Lexical root -> outer -> reader and keeper; only reader uses payload.
  const scopes = [script, -2, 0, 0, 0, script, 10, 1, 2, 0, script, 20, 2, 0, 1, script, 30, 2, 0, 0]
  const scopeVars = [stringId('payload'), stringId('alias')]
  const uses = [10, 0]
  const build = (): ClosureSnapshotProfile => ({
    snapshot: {
      node_count: entries.length,
      edge_count: entries.reduce((n, entry) => n + entry.edges.length, 0),
      meta: {
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
        node_types: [types],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [edgeTypes],
        location_fields: [],
        scope_fields: ['script_node_index', 'scope_id', 'depth', 'scope_context_vars_count', 'scope_uses_count'],
        scope_context_var_fields: ['name'],
        scope_use_fields: ['declaring_scope_id', 'slot_index'],
      },
    },
    nodes: entries.flatMap((entry, i) => [types.indexOf(entry.type), stringId(entry.name), i * 2 + 1, entry.size, entry.edges.length]),
    edges: entries.flatMap((entry) => entry.edges.flatMap(([type, name, to]) => [edgeTypes.indexOf(type), stringId(name), to])),
    strings,
    scopes,
    scope_context_vars: scopeVars,
    scope_uses: uses,
  })
  return { node, edge, root, script, outerInfo, context, closure, readerShared, keepShared, scopes, uses, build, integer }
}

test('ranks closures and deduplicates aliased values, nested retained subtrees and shared contexts', () => {
  const f = fixture()
  const context = f.context()
  const parent = f.node('payload', 'object', 100)
  const child = f.node('child', 'object', 300)
  f.edge(parent, 'child', child, 'property')
  f.edge(context, 'payload', parent, 'context')
  f.edge(context, 'alias', parent, 'context')
  f.closure('keeperA', context)
  f.closure('keeperB', context)
  const smaller = f.context()
  f.edge(smaller, 'payload', f.node('small', 'object', 50), 'context')
  f.closure('keeperSmall', smaller)
  const report = getDeadClosureVariables(f.build())
  expect(report.deadBytes).toBe(450)
  expect(report.closures.map((c) => [c.name, c.deadBytes])).toEqual([
    ['keeperA', 400],
    ['keeperB', 400],
    ['keeperSmall', 50],
  ])
  expect(report.contexts[0].variables.map((v) => [v.name, v.selfSize, v.retainedSize])).toEqual([
    ['payload', 100, 400],
    ['alias', 100, 400],
  ])
})

test('classifies per context instance, preserving variables accessible to a live reader', () => {
  const f = fixture()
  const live = f.context()
  const dead = f.context()
  f.edge(live, 'payload', f.node('live', 'object', 500), 'context')
  f.edge(dead, 'payload', f.node('dead', 'object', 200), 'context')
  f.closure('reader', live, f.readerShared)
  f.closure('keeper', live)
  f.closure('deadKeeper', dead)
  const report = getDeadClosureVariables(f.build())
  expect(report.deadBytes).toBe(200)
  expect(report.closures.map((c) => c.name)).toEqual(['deadKeeper'])
})

test('keeps uses in nested functions that a live closure can instantiate', () => {
  const f = fixture()
  const context = f.context()
  f.edge(context, 'payload', f.node('value', 'object', 100), 'context')
  f.closure('middle', context)
  // Put a not-yet-instantiated inner function inside keeper (scope 30).
  f.scopes.push(f.script, 40, 3, 0, 1)
  f.scopes[f.scopes.indexOf(20) + 3] = 0
  f.uses.splice(0, f.uses.length, 10, 0)
  expect(getDeadClosureVariables(f.build()).deadBytes).toBe(0)
})

test('follows previous context chains when attributing bytes to closures', () => {
  const f = fixture()
  const outer = f.context()
  const inner = f.context()
  f.edge(outer, 'payload', f.node('outer payload', 'object', 80), 'context')
  f.edge(inner, 'previous', outer)
  f.closure('nestedKeeper', inner)
  expect(getDeadClosureVariables(f.build()).closures[0].deadBytes).toBe(80)
})

test.each([0, -1])('generator continuation %s preserves only resumable body contexts', (continuation) => {
  const f = fixture()
  const context = f.context()
  f.edge(context, 'payload', f.node('value', 'object', 120), 'context')
  f.closure('keeper', context)
  const generatorFunction = f.closure('generatorFunction', f.node('system / NativeContext'), f.readerShared)
  const generator = f.node('generator', 'object')
  const map = f.node('system / Map')
  f.edge(map, 'instance_type_name', f.node('JS_ASYNC_FUNCTION_OBJECT_TYPE', 'string'))
  f.edge(generator, 'map', map)
  f.edge(generator, 'function', generatorFunction)
  f.edge(generator, 'continuation', f.integer(continuation))
  f.edge(generator, 'context', context)
  f.edge(f.root, 'pending', generator)
  expect(getDeadClosureVariables(f.build()).deadBytes).toBe(continuation === -1 ? 120 : 0)
})

test('reports scripts without usable embedded scopes', () => {
  const f = fixture()
  f.closure('keeper', f.context())
  const profile = f.build()
  profile.scopes = []
  expect(getDeadClosureVariables(profile).scriptsWithoutScopes).toEqual([
    expect.objectContaining({ scriptName: 'test.js', contextCount: 1 }),
  ])
})

test('rejects snapshots without scope metadata', () => {
  const profile = fixture().build()
  delete profile.scope_uses
  expect(() => getDeadClosureVariables(profile)).toThrow('requires V8 heap snapshots with embedded scope metadata')
})

test('compares overall bytes for growth, equality and shrinkage', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dead-closure-'))
  try {
    const paths = [join(directory, 'small.json'), join(directory, 'large.json')]
    for (const [i, path] of paths.entries()) {
      const f = fixture()
      const context = f.context()
      f.edge(context, 'payload', f.node('value', 'object', (i + 1) * 100), 'context')
      f.closure('keeper', context)
      await writeFile(path, JSON.stringify(f.build()))
    }
    expect(await compareDeadClosureVariables(paths[0], paths[1])).toMatchObject({ before: 100, after: 200, delta: 100 })
    expect(await compareDeadClosureVariables(paths[0], paths[0])).toMatchObject({ before: 100, after: 100, delta: 0 })
    expect(await compareDeadClosureVariables(paths[1], paths[0])).toMatchObject({ before: 200, after: 100, delta: -100 })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('reuses shared context-chain lookups, including absent previous contexts', () => {
  const f = fixture()
  const outer = f.context()
  const inner = f.context()
  f.edge(inner, 'previous', outer)
  const profile = f.build()
  const snapshot = new HeapSnapshot(profile)
  let edgeReads = 0
  profile.edges = new Proxy(profile.edges, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) edgeReads++
      return Reflect.get(target, key, receiver)
    },
  })
  const node = snapshot.createNode()
  node.nodeIndex = inner
  expect(node.findInternalEdgeTarget('previous')?.nodeIndex).toBe(outer)
  node.nodeIndex = outer
  expect(node.findInternalEdgeTarget('previous')).toBeUndefined()
  expect(edgeReads).toBeGreaterThan(0)
  edgeReads = 0
  node.nodeIndex = inner
  expect(node.findInternalEdgeTarget('previous')?.nodeIndex).toBe(outer)
  node.nodeIndex = outer
  expect(node.findInternalEdgeTarget('previous')).toBeUndefined()
  expect(edgeReads).toBe(0)
})

test('keeps reports compact when many closures retain the same context', () => {
  const f = fixture()
  const context = f.context()
  f.edge(context, 'payload', f.node('large-value-name-'.repeat(150), 'object', 512), 'context')
  for (let index = 0; index < 1000; index++) f.closure(`keeper${index}`, context)
  const report = getDeadClosureVariables(f.build())
  expect(report.deadBytes).toBe(512)
  expect(report.closures).toHaveLength(1000)
  expect(report.contexts).toHaveLength(1)
  expect(
    report.closures.every(
      (closure) => closure.contextNodeIds.length === 1 && closure.contextNodeIds[0] === report.contexts[0].contextNodeId,
    ),
  ).toBe(true)
  expect(JSON.stringify(report).length).toBeLessThan(200_000)
})

test('reports only growing function locations, deduplicates shared contexts and maps original sources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dead-closure-locations-'))
  try {
    const { SourceMapGenerator } = await import('source-map')
    const generatedMap = new SourceMapGenerator({ file: 'bundle.js' })
    generatedMap.addMapping({
      generated: { line: 2, column: 11 },
      original: { line: 7, column: 3 },
      source: 'original.ts',
      name: 'growingKeeper',
    })
    generatedMap.setSourceContent('original.ts', 'export function growingKeeper() {}')
    await writeFile(join(directory, 'bundle.js.map'), generatedMap.toString())
    const paths = [join(directory, 'before.json'), join(directory, 'after.json')]
    for (const [index, path] of paths.entries()) {
      const f = fixture()
      if (index) f.node('shift heap node indexes')
      const locations: number[] = []
      const add = (name: string, size: number, line: number, copies = 1) => {
        const context = f.context()
        f.edge(context, 'payload', f.node('value', 'object', size), 'context')
        for (let copy = 0; copy < copies; copy++) {
          const closure = f.closure(name, context)
          locations.push(closure, 77 + index, f.script, line, 10)
        }
      }
      add('minified', index ? 150 : 100, 1, index ? 3 : 2)
      add('minified', 500, 2)
      add('shrinking', index ? 100 : 200, 3)
      if (index) add('newClosure', 90, 4)
      const profile = f.build()
      profile.snapshot.meta = {
        ...profile.snapshot.meta,
        location_fields: ['object_index', 'script_id', 'script_object_index', 'line', 'column'],
      }
      profile.locations = locations
      await writeFile(path, JSON.stringify(profile))
    }
    const scriptMap = { 78: { url: join(directory, 'bundle.js'), sourceMapUrl: 'bundle.js.map' } }
    const result = await compareDeadClosureVariables(paths[0], paths[1], scriptMap)
    expect(result.beforeDetails).toEqual({ deadBytes: 800 })
    expect(result.afterDetails).toEqual({ deadBytes: 840 })
    expect(result.closures).toHaveLength(2)
    expect(result.closures.map((row) => [row.name, row.delta])).toEqual([
      ['newClosure', 90],
      ['minified', 50],
    ])
    expect(result.closures[1]).toMatchObject({
      beforeCount: 2,
      count: 3,
      beforeDeadBytes: 100,
      deadBytes: 150,
      sourceLocation: `${join(directory, 'bundle.js')}:1:10`,
      originalLocation: 'original.ts:7:3',
      originalName: 'growingKeeper',
    })
    expect(JSON.stringify(result).length).toBeLessThan(3000)
    const identical = await compareDeadClosureVariables(paths[1], paths[1], scriptMap)
    expect(identical.closures).toEqual([])
    const total = await compareDeadClosureVariables(paths[0], paths[1], scriptMap, { mode: 'total' })
    expect(total.closures.map((row) => [row.name, row.deadBytes, row.delta])).toEqual([
      ['minified', 500, 0],
      ['minified', 150, 50],
      ['shrinking', 100, -100],
      ['newClosure', 90, 90],
    ])
    expect(total.closures[1]).toMatchObject({ originalLocation: 'original.ts:7:3', originalName: 'growingKeeper' })
    expect(total.afterDetails).toMatchObject({ deadBytes: 840, scriptsWithoutScopes: [] })
    const unchangedTotal = await compareDeadClosureVariables(paths[1], paths[1], scriptMap, { mode: 'total' })
    expect(unchangedTotal.closures).toHaveLength(4)
    expect(unchangedTotal.closures.every((row) => row.delta === 0)).toBe(true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
