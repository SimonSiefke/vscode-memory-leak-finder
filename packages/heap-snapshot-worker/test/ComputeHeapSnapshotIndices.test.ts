import { test, expect } from '@jest/globals'
import { computeHeapSnapshotIndices } from '../src/parts/ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'

test('computeHeapSnapshotIndices - basic functionality', () => {
  const node_types = [['hidden', 'array', 'string', 'object', 'bigint', 'regexp']]
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness']
  const edge_types = [['context', 'element', 'property', 'internal', 'hidden']]
  const edge_fields = ['type', 'name_or_index', 'to_node']

  const result = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  expect(result).toEqual({
    // Type indices
    objectTypeIndex: 3,
    bigintTypeIndex: 4,
    regexpTypeIndex: 5,
    nativeTypeIndex: -1,

    traceNodeIdFieldIndex: -1,
    // Items per record
    ITEMS_PER_NODE: 6,
    ITEMS_PER_EDGE: 3,

    // Node field indices
    typeFieldIndex: 0,
    nameFieldIndex: 1,
    idFieldIndex: 2,
    selfSizeFieldIndex: 3,
    edgeCountFieldIndex: 4,
    detachednessFieldIndex: 5,

    // Edge field indices
    edgeTypeFieldIndex: 0,
    edgeNameFieldIndex: 1,
    edgeToNodeFieldIndex: 2,

    // Type arrays for reference
    edgeTypes: ['context', 'element', 'property', 'internal', 'hidden'],
    nodeTypes: ['hidden', 'array', 'string', 'object', 'bigint', 'regexp'],
  })
})

test('computeHeapSnapshotIndices - missing types return -1', () => {
  const node_types = [['hidden', 'array', 'string']] // No object, bigint, or regexp
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness']
  const edge_types = [['context', 'element', 'property']]
  const edge_fields = ['type', 'name_or_index', 'to_node']

  const result = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  expect(result.objectTypeIndex).toBe(-1)
  expect(result.bigintTypeIndex).toBe(-1)
  expect(result.regexpTypeIndex).toBe(-1)
  expect(result.ITEMS_PER_NODE).toBe(6)
  expect(result.ITEMS_PER_EDGE).toBe(3)
})

test('computeHeapSnapshotIndices - different field order', () => {
  const node_types = [['object', 'bigint', 'string']]
  const node_fields = ['id', 'type', 'name', 'self_size', 'detachedness', 'edge_count'] // Different order
  const edge_types = [['property', 'element', 'context']]
  const edge_fields = ['name_or_index', 'type', 'to_node'] // Different order

  const result = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  expect(result.objectTypeIndex).toBe(0)
  expect(result.bigintTypeIndex).toBe(1)
  expect(result.typeFieldIndex).toBe(1) // 'type' is at index 1
  expect(result.nameFieldIndex).toBe(2) // 'name' is at index 2
  expect(result.idFieldIndex).toBe(0) // 'id' is at index 0
  expect(result.edgeCountFieldIndex).toBe(5) // 'edge_count' is at index 5
  expect(result.edgeTypeFieldIndex).toBe(1) // 'type' is at index 1 in edges
  expect(result.edgeNameFieldIndex).toBe(0) // 'name_or_index' is at index 0 in edges
})
