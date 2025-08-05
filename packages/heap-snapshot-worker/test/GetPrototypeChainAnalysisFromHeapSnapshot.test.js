import { test, expect } from '@jest/globals'
import * as GetPrototypeChainAnalysisFromHeapSnapshot from '../src/parts/GetPrototypeChainAnalysisFromHeapSnapshot/GetPrototypeChainAnalysisFromHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

test('detectsLongPrototypeChains', async () => {
  // Mock a heap snapshot with long prototype chains
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    // Create a chain: instance -> ComponentA -> ComponentB -> ComponentC -> ... -> Object (15 levels deep)
    nodes: [
      // Node 0: Instance object
      3, 0, 0, 100, 1, 0, 0,
      // Node 1: ComponentA
      3, 1, 1, 80, 1, 0, 0,
      // Node 2: ComponentB
      3, 2, 2, 80, 1, 0, 0,
      // Node 3: ComponentC
      3, 3, 3, 80, 1, 0, 0,
      // Node 4: ComponentD
      3, 4, 4, 80, 1, 0, 0,
      // Node 5: ComponentE
      3, 5, 5, 80, 1, 0, 0,
      // Node 6: ComponentF
      3, 6, 6, 80, 1, 0, 0,
      // Node 7: ComponentG
      3, 7, 7, 80, 1, 0, 0,
      // Node 8: ComponentH
      3, 8, 8, 80, 1, 0, 0,
      // Node 9: ComponentI
      3, 9, 9, 80, 1, 0, 0,
      // Node 10: ComponentJ
      3, 10, 10, 80, 1, 0, 0,
      // Node 11: ComponentK
      3, 11, 11, 80, 1, 0, 0,
      // Node 12: ComponentL
      3, 12, 12, 80, 1, 0, 0,
      // Node 13: ComponentM
      3, 13, 13, 80, 1, 0, 0,
      // Node 14: ComponentN
      3, 14, 14, 80, 1, 0, 0,
      // Node 15: Object.prototype (end of chain)
      3, 15, 15, 50, 0, 0, 0,
    ],
    edges: [
      // Instance -> ComponentA
      2, 16, 1,
      // ComponentA -> ComponentB
      2, 16, 2,
      // ComponentB -> ComponentC
      2, 16, 3,
      // ComponentC -> ComponentD
      2, 16, 4,
      // ComponentD -> ComponentE
      2, 16, 5,
      // ComponentE -> ComponentF
      2, 16, 6,
      // ComponentF -> ComponentG
      2, 16, 7,
      // ComponentG -> ComponentH
      2, 16, 8,
      // ComponentH -> ComponentI
      2, 16, 9,
      // ComponentI -> ComponentJ
      2, 16, 10,
      // ComponentJ -> ComponentK
      2, 16, 11,
      // ComponentK -> ComponentL
      2, 16, 12,
      // ComponentL -> ComponentM
      2, 16, 13,
      // ComponentM -> ComponentN
      2, 16, 14,
      // ComponentN -> Object.prototype
      2, 16, 15,
    ],
    strings: [
      'MyInstance', // 0
      'ComponentA', // 1
      'ComponentB', // 2
      'ComponentC', // 3
      'ComponentD', // 4
      'ComponentE', // 5
      'ComponentF', // 6
      'ComponentG', // 7
      'ComponentH', // 8
      'ComponentI', // 9
      'ComponentJ', // 10
      'ComponentK', // 11
      'ComponentL', // 12
      'ComponentM', // 13
      'ComponentN', // 14
      'Object', // 15
      '__proto__', // 16
    ],
    locations: [],
  }

  // Store the mock snapshot
  HeapSnapshotState.set('test-long-chain', heapsnapshot)

  const analysis = await GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot('test-long-chain')

  // Should detect the long chain
  expect(analysis.longPrototypeChains).toHaveLength(1)
  expect(analysis.longPrototypeChains[0].chainLength).toBe(15)
  expect(analysis.longPrototypeChains[0].nodeId).toBe(0) // The instance node

  // Should identify it as a possible framework issue
  expect(analysis.suspiciousPatterns.possibleFrameworkIssue).toHaveLength(1)
  expect(analysis.suspiciousPatterns.deepInheritance).toHaveLength(1)

  // Statistics should reflect the long chain
  expect(analysis.prototypeStatistics.max).toBe(15)
  expect(analysis.prototypeStatistics.average).toBe(15)

  // Clean up
  HeapSnapshotState.dispose('test-long-chain')
})

test('detectsPrototypePollution', async () => {
  // Mock a heap snapshot with prototype pollution
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    // Create many objects that all inherit from a polluted Object.prototype
    nodes: [
      // 1000 user objects
      ...Array.from({ length: 1000 }, (_, i) => [3, 0, i, 50, 1, 0, 0]).flat(),
      // Object.prototype with pollution
      3,
      1,
      1000,
      100,
      2,
      0,
      0,
    ],
    edges: [
      // All user objects point to polluted Object.prototype
      ...Array.from({ length: 1000 }, (_, i) => [2, 2, 1000]).flat(),
      // Object.prototype has polluted properties
      2,
      3,
      1001, // isAdmin property
      2,
      4,
      1002, // secret property
    ],
    strings: [
      'UserObject', // 0
      'Object', // 1
      '__proto__', // 2
      'isAdmin', // 3 - POLLUTION!
      'secretData', // 4 - POLLUTION!
    ],
    locations: [],
  }

  // Store the mock snapshot
  HeapSnapshotState.set('test-pollution', heapsnapshot)

  const analysis = await GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot('test-pollution')

  // Should detect prototype pollution
  expect(analysis.prototypePollution.length).toBeGreaterThan(0)

  const pollution = analysis.prototypePollution.find((p) => p.propertyName === 'isAdmin')
  expect(pollution).toBeDefined()
  expect(pollution.affectedObjectCount).toBe(1000)
  expect(pollution.severity).toBe('critical') // Because 'isAdmin' is security-related

  // Should identify it as a security issue
  expect(analysis.suspiciousPatterns.securityIssues.length).toBeGreaterThan(0)

  // Clean up
  HeapSnapshotState.dispose('test-pollution')
})

test('handlesNormalPrototypeChains', async () => {
  // Mock a heap snapshot with normal, short prototype chains
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    // Normal objects with short chains: instance -> prototype -> Object.prototype
    nodes: [
      // Instance
      3, 0, 0, 50, 1, 0, 0,
      // Custom prototype
      3, 1, 1, 30, 1, 0, 0,
      // Object.prototype
      3, 2, 2, 20, 0, 0, 0,
    ],
    edges: [
      // Instance -> Custom prototype
      2, 3, 1,
      // Custom prototype -> Object.prototype
      2, 3, 2,
    ],
    strings: [
      'MyObject', // 0
      'MyPrototype', // 1
      'Object', // 2
      '__proto__', // 3
    ],
    locations: [],
  }

  // Store the mock snapshot
  HeapSnapshotState.set('test-normal', heapsnapshot)

  const analysis = await GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot('test-normal')

  // Should not detect any issues
  expect(analysis.longPrototypeChains).toHaveLength(0)
  expect(analysis.prototypePollution).toHaveLength(0)
  expect(analysis.suspiciousPatterns.securityIssues).toHaveLength(0)
  expect(analysis.suspiciousPatterns.deepInheritance).toHaveLength(0)

  // Statistics should show normal chain length
  expect(analysis.prototypeStatistics.max).toBeLessThanOrEqual(3)
  expect(analysis.prototypeStatistics.average).toBeLessThanOrEqual(3)

  // Clean up
  HeapSnapshotState.dispose('test-normal')
})
