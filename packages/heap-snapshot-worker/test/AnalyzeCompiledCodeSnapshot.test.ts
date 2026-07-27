import { expect, test } from '@jest/globals'
import { analyzeCompiledCodeSnapshot } from '../src/parts/AnalyzeCompiledCodeSnapshot/AnalyzeCompiledCodeSnapshot.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']
const edgeFields = ['type', 'name_or_index', 'to_node']
const locationFields = ['object_index', 'script_id', 'line', 'column']
const nodeTypes = ['hidden', 'array', 'string', 'object', 'code', 'closure']
const edgeTypes = ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']

interface EdgeFixture {
  readonly name: string | number
  readonly target: number
  readonly type: string
}

interface NodeFixture {
  readonly edges?: readonly EdgeFixture[]
  readonly name: string
  readonly size: number
  readonly type: string
}

const createSnapshot = (): Snapshot => {
  const fixtures: readonly NodeFixture[] = [
    {
      edges: [
        { name: 'shared', target: 1, type: 'internal' },
        { name: 'code', target: 2, type: 'internal' },
        { name: 'feedback_cell', target: 3, type: 'internal' },
      ],
      name: 'foo',
      size: 24,
      type: 'closure',
    },
    {
      edges: [
        { name: 'trusted_function_data', target: 4, type: 'internal' },
        { name: 'script', target: 7, type: 'internal' },
        { name: 'raw_outer_scope_info_or_feedback_metadata', target: 8, type: 'internal' },
      ],
      name: 'system / SharedFunctionInfo / foo',
      size: 40,
      type: 'code',
    },
    {
      edges: [{ name: 'instruction_stream', target: 5, type: 'internal' }],
      name: 'system / Code',
      size: 64,
      type: 'code',
    },
    {
      edges: [{ name: 'value', target: 6, type: 'internal' }],
      name: 'system / FeedbackCell',
      size: 16,
      type: 'code',
    },
    {
      edges: [{ name: 0, target: 9, type: 'hidden' }],
      name: 'system / BytecodeArray',
      size: 100,
      type: 'code',
    },
    {
      edges: [{ name: 'code', target: 2, type: 'internal' }],
      name: 'system / InstructionStream',
      size: 200,
      type: 'code',
    },
    { name: 'system / FeedbackVector', size: 32, type: 'code' },
    { name: 'system / Script / app.js', size: 80, type: 'code' },
    { name: 'system / ScopeInfo', size: 50, type: 'code' },
    {
      edges: [{ name: 'cache', target: 12, type: 'weak' }],
      name: 'system / SharedFunctionInfo / bar',
      size: 40,
      type: 'code',
    },
    {
      edges: [
        { name: 'shared', target: 9, type: 'internal' },
        { name: 'code', target: 2, type: 'internal' },
      ],
      name: 'bar',
      size: 24,
      type: 'closure',
    },
    { name: 'Other', size: 999, type: 'object' },
    { name: 'system / BytecodeArray', size: 25, type: 'code' },
  ]
  const strings: string[] = []
  const stringIndexes = new Map<string, number>()
  const getStringIndex = (value: string): number => {
    let index = stringIndexes.get(value)
    if (index === undefined) {
      index = strings.length
      strings.push(value)
      stringIndexes.set(value, index)
    }
    return index
  }
  const nodes: number[] = []
  const edges: number[] = []
  for (let ordinal = 0; ordinal < fixtures.length; ordinal++) {
    const fixture = fixtures[ordinal]
    nodes.push(
      nodeTypes.indexOf(fixture.type),
      getStringIndex(fixture.name),
      ordinal * 2 + 1,
      fixture.size,
      fixture.edges?.length || 0,
      0,
      0,
    )
    for (const edge of fixture.edges || []) {
      edges.push(
        edgeTypes.indexOf(edge.type),
        typeof edge.name === 'number' ? edge.name : getStringIndex(edge.name),
        edge.target * nodeFields.length,
      )
    }
  }
  return {
    edge_count: edges.length / edgeFields.length,
    edges: new Uint32Array(edges),
    extra_native_bytes: 0,
    locations: new Uint32Array([
      0 * nodeFields.length,
      1,
      10,
      2,
      10 * nodeFields.length,
      1,
      20,
      3,
    ]),
    meta: {
      edge_fields: edgeFields,
      edge_types: [edgeTypes],
      location_fields: locationFields,
      node_fields: nodeFields,
      node_types: [nodeTypes],
    },
    node_count: fixtures.length,
    nodes: new Uint32Array(nodes),
    strings,
  }
}

test('attributes compiled code to functions and reconciles exact totals', () => {
  const result = analyzeCompiledCodeSnapshot(createSnapshot())

  expect(result.totals).toEqual({
    attributedBytes: 228,
    bytecodeBytes: 125,
    instructionBytes: 200,
    metadataBytes: 322,
    sharedBytes: 264,
    totalBytes: 647,
    unattributedBytes: 155,
  })
  expect(result.totals.attributedBytes + result.totals.sharedBytes + result.totals.unattributedBytes).toBe(
    result.totals.totalBytes,
  )
  expect(result.functions).toEqual([
    {
      bytecodeBytes: 100,
      column: 2,
      instructionBytes: 0,
      key: '1:10:2:foo',
      line: 10,
      metadataBytes: 88,
      name: 'foo',
      scriptId: 1,
      totalBytes: 188,
    },
    {
      bytecodeBytes: 0,
      column: 3,
      instructionBytes: 0,
      key: '1:20:3:bar',
      line: 20,
      metadataBytes: 40,
      name: 'bar',
      scriptId: 1,
      totalBytes: 40,
    },
  ])
})
