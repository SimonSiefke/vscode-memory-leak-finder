import { expect, test } from '@jest/globals'
import { buildRetainerGraph, getRetainerRiverAnalysis } from '../src/parts/GetRetainerRiverAnalysis/GetRetainerRiverAnalysis.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

interface TestEdge {
  readonly name: number | string
  readonly target: number
  readonly type?: string
}

interface TestNode {
  readonly edges?: readonly TestEdge[]
  readonly id: number
  readonly name: string
  readonly selfSize?: number
  readonly traceNodeId?: number
  readonly type?: string
}

const nodeTypes = ['synthetic', 'object', 'array', 'closure']
const edgeTypes = ['context', 'element', 'property', 'internal', 'weak']

const createSnapshot = (
  testNodes: readonly TestNode[],
  options: {
    readonly traceFunctions?: readonly {
      readonly column: number
      readonly functionName: string
      readonly line: number
      readonly scriptId: number
      readonly source: string
    }[]
    readonly traceTree?: readonly unknown[]
  } = {},
): Snapshot => {
  const strings = ['']
  const stringIndex = (value: string): number => {
    const existing = strings.indexOf(value)
    if (existing !== -1) {
      return existing
    }
    strings.push(value)
    return strings.length - 1
  }
  const nodes: number[] = []
  const edges: number[] = []
  for (const node of testNodes) {
    nodes.push(
      nodeTypes.indexOf(node.type || 'object'),
      stringIndex(node.name),
      node.id,
      node.selfSize || 0,
      node.edges?.length || 0,
      node.traceNodeId || 0,
      0,
    )
    for (const edge of node.edges || []) {
      const edgeType = edge.type || 'property'
      edges.push(edgeTypes.indexOf(edgeType), edgeType === 'element' ? Number(edge.name) : stringIndex(String(edge.name)), edge.target * 7)
    }
  }
  const traceFunctionInfos: number[] = []
  for (const frame of options.traceFunctions || []) {
    traceFunctionInfos.push(stringIndex(frame.functionName), stringIndex(frame.source), frame.scriptId, frame.line, frame.column)
  }
  return {
    edge_count: edges.length / 3,
    edges: new Uint32Array(edges),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [edgeTypes],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [nodeTypes],
      trace_function_info_fields: ['name', 'script_name', 'script_id', 'line', 'column'],
      trace_node_fields: ['id', 'function_info_index', 'count', 'size', 'children'],
    },
    node_count: testNodes.length,
    nodes: new Uint32Array(nodes),
    strings,
    traceFunctionInfos: new Uint32Array(traceFunctionInfos),
    traceTree: options.traceTree || [],
  }
}

const before = createSnapshot([
  { edges: [{ name: 'service', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
  { edges: [{ name: '_listeners', target: 2 }], id: 3, name: 'EditorService' },
  { id: 5, name: 'Array', type: 'array' },
])

test('getRetainerRiverAnalysis aggregates retained bytes and concrete evidence for new objects', () => {
  const after = createSnapshot([
    { edges: [{ name: 'service', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
    { edges: [{ name: '_listeners', target: 2 }], id: 3, name: 'EditorService' },
    {
      edges: [
        { name: 0, target: 3, type: 'element' },
        { name: 1, target: 4, type: 'element' },
      ],
      id: 5,
      name: 'Array',
      type: 'array',
    },
    { id: 7, name: 'CodeEditorWidget', selfSize: 100 },
    { id: 9, name: 'CodeEditorWidget', selfSize: 200 },
  ])

  const report = getRetainerRiverAnalysis(before, after, { minimumCount: 2 })

  expect(report.isLeak).toBe(true)
  expect(report.summary).toEqual({
    leakedObjects: 2,
    retainedBytes: 300,
    retainingPaths: 1,
  })
  expect(report.nodes.map((node) => node.label)).toEqual(['(GC roots)', 'EditorService', 'Array', 'CodeEditorWidget'])
  expect(report.links).toHaveLength(3)
  expect(report.links[2].evidence).toHaveLength(2)
  expect(report.links[2].evidence.map((item) => item.retainingProperty)).toEqual(['[0]', '[1]'])
})

test('buildRetainerGraph excludes weak references and handles cycles', () => {
  const after = createSnapshot([
    {
      edges: [
        { name: 'strong', target: 1 },
        { name: 'weak', target: 3, type: 'weak' },
      ],
      id: 1,
      name: '(GC roots)',
      type: 'synthetic',
    },
    { edges: [{ name: 'child', target: 2 }], id: 3, name: 'OwnerService' },
    { edges: [{ name: 'back', target: 1 }], id: 5, name: 'Leaked', selfSize: 10 },
    { id: 7, name: 'WeakOnly', selfSize: 50 },
  ])

  const graph = buildRetainerGraph(after)

  expect([...graph.reachable]).toEqual([1, 1, 1, 0])
  expect(graph.parent[2]).toBe(1)
  expect(graph.idom[2]).toBe(1)
  expect(graph.retainedSizes[1]).toBe(10)
})

test('getRetainerRiverAnalysis records a shortest GC-root path', () => {
  const after = createSnapshot([
    {
      edges: [
        { name: 'service', target: 1 },
        { name: 'shortcut', target: 3 },
      ],
      id: 1,
      name: '(GC roots)',
      type: 'synthetic',
    },
    { edges: [{ name: 'collection', target: 2 }], id: 3, name: 'EditorService' },
    { edges: [{ name: 'longPath', target: 3 }], id: 5, name: 'Array', type: 'array' },
    { id: 7, name: 'Leaked', selfSize: 10 },
  ])

  const report = getRetainerRiverAnalysis(before, after)

  expect(report.links[0].evidence[0].path).toHaveLength(1)
  expect(report.links[0].evidence[0].retainingProperty).toBe('shortcut')
})

test('getRetainerRiverAnalysis removes candidates dominated by another selected candidate', () => {
  const baseline = createSnapshot([
    { edges: [{ name: 'service', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
    { id: 3, name: 'EditorService' },
  ])
  const after = createSnapshot([
    { edges: [{ name: 'service', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
    { edges: [{ name: 'container', target: 2 }], id: 3, name: 'EditorService' },
    { edges: [{ name: 'child', target: 3 }], id: 5, name: 'LeakingContainer', selfSize: 40 },
    { id: 7, name: 'LeakedChild', selfSize: 60 },
  ])

  const report = getRetainerRiverAnalysis(baseline, after)

  expect(report.summary.leakedObjects).toBe(1)
  expect(report.summary.retainedBytes).toBe(100)
  expect(report.nodes.at(-1)?.label).toBe('LeakingContainer')
})

test('getRetainerRiverAnalysis preserves allocation stacks and infers a source owner', () => {
  const baseline = createSnapshot([
    { edges: [{ name: 'owner', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
    { id: 3, name: 'Array', type: 'array' },
  ])
  const after = createSnapshot(
    [
      { edges: [{ name: 'owner', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
      {
        edges: [{ name: 0, target: 2, type: 'element' }],
        id: 3,
        name: 'Array',
        traceNodeId: 1,
        type: 'array',
      },
      { id: 5, name: 'Leaked', selfSize: 64, traceNodeId: 2 },
    ],
    {
      traceFunctions: [
        { column: 4, functionName: 'createOwner', line: 10, scriptId: 17, source: '/src/owner.js' },
        { column: 8, functionName: 'createLeak', line: 20, scriptId: 18, source: '/src/leak.js' },
      ],
      traceTree: [1, 0, 1, 16, [2, 1, 1, 64, []]],
    },
  )

  const report = getRetainerRiverAnalysis(baseline, after)
  const evidence = report.links[0].evidence[0]

  expect(report.nodes[1]).toMatchObject({
    inferred: true,
    label: 'owner.js (inferred owner)',
  })
  expect(evidence.allocationStack[0]).toMatchObject({
    functionName: 'createOwner',
    generated: { column: 4, line: 10, scriptId: 17, source: '/src/owner.js' },
  })
  expect(evidence.leakedObjectStack[0]).toMatchObject({
    functionName: 'createLeak',
    generated: { source: '/src/leak.js' },
  })
})

test('getRetainerRiverAnalysis uses the leaked allocation module when retaining objects have no trace', () => {
  const baseline = createSnapshot([
    { edges: [{ name: 'global', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
    { edges: [{ name: 'items', target: 2 }], id: 3, name: 'global / ' },
    { id: 5, name: 'Array', type: 'array' },
  ])
  const after = createSnapshot(
    [
      { edges: [{ name: 'global', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
      { edges: [{ name: 'items', target: 2 }], id: 3, name: 'global / ' },
      { edges: [{ name: 0, target: 3, type: 'element' }], id: 5, name: 'Array', type: 'array' },
      { id: 7, name: 'Leaked', selfSize: 64, traceNodeId: 1 },
    ],
    {
      traceFunctions: [{ column: 8, functionName: 'createLeak', line: 20, scriptId: 18, source: '/src/features/leak.js' }],
      traceTree: [1, 0, 1, 64, []],
    },
  )

  const report = getRetainerRiverAnalysis(baseline, after)

  expect(report.nodes[1]).toMatchObject({
    inferred: true,
    label: 'leak.js (inferred owner)',
  })
  expect(report.nodes[2].label).toBe('Array')
})

test('getRetainerRiverAnalysis returns a clear empty report when growth is below the run threshold', () => {
  const after = createSnapshot([
    { edges: [{ name: 'service', target: 1 }], id: 1, name: '(GC roots)', type: 'synthetic' },
    { edges: [{ name: 'leak', target: 2 }], id: 3, name: 'EditorService' },
    { id: 7, name: 'SingleObject', selfSize: 20 },
  ])

  const report = getRetainerRiverAnalysis(before, after, { minimumCount: 2 })

  expect(report).toMatchObject({
    isLeak: false,
    links: [],
    nodes: [],
    summary: {
      leakedObjects: 0,
      retainedBytes: 0,
      retainingPaths: 0,
    },
  })
})
