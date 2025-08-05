import pkg from '@jest/globals'
const { test, expect } = pkg
import * as GetPrototypeChainAnalysisFromHeapSnapshot from '../packages/heap-snapshot-worker/src/parts/GetPrototypeChainAnalysisFromHeapSnapshot/GetPrototypeChainAnalysisFromHeapSnapshot.js'
import * as HeapSnapshotState from '../packages/heap-snapshot-worker/src/parts/HeapSnapshotState/HeapSnapshotState.js'

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
      // Node 0: Instance object (type=3=object, name=0=MyInstance, id=0, self_size=100, edge_count=1, trace_node_id=0, detachedness=0)
      3, 0, 0, 100, 1, 0, 0,
      // Node 1: ComponentA (type=3=object, name=1=ComponentA, id=1, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 1, 1, 80, 1, 0, 0,
      // Node 2: ComponentB (type=3=object, name=2=ComponentB, id=2, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 2, 2, 80, 1, 0, 0,
      // Node 3: ComponentC (type=3=object, name=3=ComponentC, id=3, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 3, 3, 80, 1, 0, 0,
      // Node 4: ComponentD (type=3=object, name=4=ComponentD, id=4, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 4, 4, 80, 1, 0, 0,
      // Node 5: ComponentE (type=3=object, name=5=ComponentE, id=5, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 5, 5, 80, 1, 0, 0,
      // Node 6: ComponentF (type=3=object, name=6=ComponentF, id=6, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 6, 6, 80, 1, 0, 0,
      // Node 7: ComponentG (type=3=object, name=7=ComponentG, id=7, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 7, 7, 80, 1, 0, 0,
      // Node 8: ComponentH (type=3=object, name=8=ComponentH, id=8, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 8, 8, 80, 1, 0, 0,
      // Node 9: ComponentI (type=3=object, name=9=ComponentI, id=9, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 9, 9, 80, 1, 0, 0,
      // Node 10: ComponentJ (type=3=object, name=10=ComponentJ, id=10, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 10, 10, 80, 1, 0, 0,
      // Node 11: ComponentK (type=3=object, name=11=ComponentK, id=11, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 11, 11, 80, 1, 0, 0,
      // Node 12: ComponentL (type=3=object, name=12=ComponentL, id=12, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 12, 12, 80, 1, 0, 0,
      // Node 13: ComponentM (type=3=object, name=13=ComponentM, id=13, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 13, 13, 80, 1, 0, 0,
      // Node 14: ComponentN (type=3=object, name=14=ComponentN, id=14, self_size=80, edge_count=1, trace_node_id=0, detachedness=0)
      3, 14, 14, 80, 1, 0, 0,
      // Node 15: Object.prototype (end of chain) (type=3=object, name=15=Object, id=15, self_size=50, edge_count=0, trace_node_id=0, detachedness=0)
      3, 15, 15, 50, 0, 0, 0,
    ],
    edges: [
      // Instance -> ComponentA (type=2=property, name_or_index=16=__proto__, to_node=1*7=7)
      2, 16, 7,
      // ComponentA -> ComponentB (type=2=property, name_or_index=16=__proto__, to_node=2*7=14)
      2, 16, 14,
      // ComponentB -> ComponentC (type=2=property, name_or_index=16=__proto__, to_node=3*7=21)
      2, 16, 21,
      // ComponentC -> ComponentD (type=2=property, name_or_index=16=__proto__, to_node=4*7=28)
      2, 16, 28,
      // ComponentD -> ComponentE (type=2=property, name_or_index=16=__proto__, to_node=5*7=35)
      2, 16, 35,
      // ComponentE -> ComponentF (type=2=property, name_or_index=16=__proto__, to_node=6*7=42)
      2, 16, 42,
      // ComponentF -> ComponentG (type=2=property, name_or_index=16=__proto__, to_node=7*7=49)
      2, 16, 49,
      // ComponentG -> ComponentH (type=2=property, name_or_index=16=__proto__, to_node=8*7=56)
      2, 16, 56,
      // ComponentH -> ComponentI (type=2=property, name_or_index=16=__proto__, to_node=9*7=63)
      2, 16, 63,
      // ComponentI -> ComponentJ (type=2=property, name_or_index=16=__proto__, to_node=10*7=70)
      2, 16, 70,
      // ComponentJ -> ComponentK (type=2=property, name_or_index=16=__proto__, to_node=11*7=77)
      2, 16, 77,
      // ComponentK -> ComponentL (type=2=property, name_or_index=16=__proto__, to_node=12*7=84)
      2, 16, 84,
      // ComponentL -> ComponentM (type=2=property, name_or_index=16=__proto__, to_node=13*7=91)
      2, 16, 91,
      // ComponentM -> ComponentN (type=2=property, name_or_index=16=__proto__, to_node=14*7=98)
      2, 16, 98,
      // ComponentN -> Object.prototype (type=2=property, name_or_index=16=__proto__, to_node=15*7=105)
      2, 16, 105,
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
      3, 1, 1000, 100, 2, 0, 0,
    ],
    edges: [
      // All user objects point to polluted Object.prototype
      ...Array.from({ length: 1000 }, (_, i) => [2, 2, 7000]).flat(), // 1000 * 7 = 7000
      // Object.prototype has polluted properties
      2, 3, 7001, // isAdmin property
      2, 4, 7002, // secret property
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
      // Instance (type=3=object, name=0=MyObject, id=0, self_size=50, edge_count=1, trace_node_id=0, detachedness=0)
      3, 0, 0, 50, 1, 0, 0,
      // Custom prototype (type=3=object, name=1=MyPrototype, id=1, self_size=30, edge_count=1, trace_node_id=0, detachedness=0)
      3, 1, 1, 30, 1, 0, 0,
      // Object.prototype (type=3=object, name=2=Object, id=2, self_size=20, edge_count=0, trace_node_id=0, detachedness=0)
      3, 2, 2, 20, 0, 0, 0,
    ],
    edges: [
      // Instance -> Custom prototype (type=2=property, name_or_index=3=__proto__, to_node=1*7=7)
      2, 3, 7,
      // Custom prototype -> Object.prototype (type=2=property, name_or_index=3=__proto__, to_node=2*7=14)
      2, 3, 14,
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
