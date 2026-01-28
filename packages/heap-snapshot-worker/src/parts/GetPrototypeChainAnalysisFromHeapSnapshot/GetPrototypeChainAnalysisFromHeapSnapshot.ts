import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshotInternalEdges from '../ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.ts'
import * as ParseHeapSnapshotInternalNodes from '../ParseHeapSnapshotInternalNodes/ParseHeapSnapshotInternalNodes.ts'

export interface ParsedNode {
  readonly edgeCount: number
  readonly id: number
  readonly name: string
  readonly type: string
}

export interface ParsedEdge {
  readonly nameOrIndex: string
  readonly toNode: number
  readonly type: string
}

export interface ChainEntry {
  readonly nodeId: number
  readonly nodeName: string
  readonly nodeType: string
}

export interface PrototypeProperty {
  readonly propertyName: string
  readonly prototypeId: number
  readonly prototypeName: string
}

export interface SuspiciousProperty {
  readonly message: string
  readonly nodeId?: number
  readonly propertyName?: string
  readonly prototypeName?: string
  readonly type: string
}

export interface ChainAnalysisResult {
  readonly chain: readonly ChainEntry[]
  readonly length: number
  readonly prototypeProperties: readonly PrototypeProperty[]
  readonly suspiciousProperties: readonly SuspiciousProperty[]
}

export interface LongChainResult {
  readonly chainLength: number
  readonly nodeId: number
  readonly nodeName: string
  readonly nodeType: string
  readonly prototypeChain: readonly ChainEntry[]
  readonly suspiciousProperties: readonly SuspiciousProperty[]
}

interface PollutionCandidate {
  readonly affectedObjects: number[]
  readonly isLikelyPollution: boolean
  readonly propertyName: string
  readonly prototypeName: string
}

export interface PollutionResult extends PollutionCandidate {
  readonly affectedObjectCount: number
  readonly severity: string
}

export interface AnalysisStatistics {
  readonly average: number
  readonly count: number
  readonly max: number
  readonly median: number
  readonly min: number
  readonly percentile95: number
}

const MAX_EXPECTED_CHAIN_LENGTH = 10
const PROTOTYPE_POLLUTION_THRESHOLD = 1000 // If this many objects share unusual properties

/**
 * Analyzes prototype chains in heap snapshot to detect memory leaks and performance issues
 * @param {string} id - Heap snapshot ID
 * @returns {Promise<Object>} Analysis results
 */
export const getPrototypeChainAnalysisFromHeapSnapshot = async (
  id: string | number,
): Promise<{
  longPrototypeChains: readonly LongChainResult[]
  prototypePollution: readonly PollutionResult[]
  prototypeStatistics: AnalysisStatistics
  suspiciousPatterns: Record<string, unknown>
  detailedResults: readonly ChainAnalysisResult[]
}> => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)

  // Parse the heap snapshot to get both nodes and properly typed edges
  const { edges, nodes, snapshot, strings } = heapsnapshot!
  const { meta } = snapshot!
  const { edge_fields, edge_types, node_fields, node_types } = meta

  const parsedNodes = ParseHeapSnapshotInternalNodes.parseHeapSnapshotInternalNodes(
    nodes,
    node_fields,
    node_types[0],
    strings,
  ) as unknown as ParsedNode[]
  const parsedEdges = ParseHeapSnapshotInternalEdges.parseHeapSnapshotInternalEdges(
    edges,
    edge_fields,
    edge_types[0],
    node_fields.length,
    strings,
  ) as unknown as ParsedEdge[]

  // Find all objects and their prototype chains
  const prototypeAnalysis = analyzePrototypeChains(parsedNodes, parsedEdges)

  return {
    detailedResults: prototypeAnalysis.detailedResults,
    longPrototypeChains: prototypeAnalysis.longChains,
    prototypePollution: prototypeAnalysis.pollution,
    prototypeStatistics: prototypeAnalysis.statistics,
    suspiciousPatterns: prototypeAnalysis.suspicious,
  }
}

/**
 * Analyzes prototype chains for various issues
 */
const analyzePrototypeChains = (parsedNodes: readonly ParsedNode[], parsedEdges: readonly ParsedEdge[]) => {
  const nodeMap = createNodeMap(parsedNodes)
  const edgeMap = createEdgeMap(parsedNodes, parsedEdges)
  const longChains: LongChainResult[] = []
  const pollutionCandidates = new Map<string, PollutionCandidate>()
  const chainLengths: number[] = []
  const detailedResults: ChainAnalysisResult[] = [] // Store detailed info for each object

  // Analyze each object's prototype chain
  // For performance, limit analysis to a sample of objects for very large heaps
  const maxObjectsToAnalyze = 1000
  const allObjectsWithPrototype = parsedNodes.filter(isObjectWithPrototype)

  // Take first objects (user objects tend to be early in heap snapshot)
  const objectsToAnalyze = allObjectsWithPrototype.slice(0, maxObjectsToAnalyze)

  for (let i = 0; i < objectsToAnalyze.length; i++) {
    const node = objectsToAnalyze[i]
    const chainAnalysis = analyzeNodePrototypeChain(node, edgeMap, nodeMap)

    chainLengths.push(chainAnalysis.length)

    // Store detailed information for each object
    detailedResults.push({
      chain: chainAnalysis.chain,
      length: chainAnalysis.length,
      prototypeProperties: chainAnalysis.prototypeProperties,
      suspiciousProperties: chainAnalysis.suspiciousProperties,
    })

    // Detect unusually long chains
    if (chainAnalysis.length > MAX_EXPECTED_CHAIN_LENGTH) {
      longChains.push({
        chainLength: chainAnalysis.length,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        prototypeChain: chainAnalysis.chain,
        suspiciousProperties: chainAnalysis.suspiciousProperties,
      })
    }

    // Track properties that appear on prototypes (potential pollution)
    for (const protoProperty of chainAnalysis.prototypeProperties) {
      const key = `${protoProperty.prototypeName}::${protoProperty.propertyName}`
      if (!pollutionCandidates.has(key)) {
        pollutionCandidates.set(key, {
          affectedObjects: [],
          isLikelyPollution: false,
          propertyName: protoProperty.propertyName,
          prototypeName: protoProperty.prototypeName,
        })
      }
      const candidate = pollutionCandidates.get(key) as PollutionCandidate
      candidate.affectedObjects.push(node.id)
    }

    // Break early if we've found enough long chains to avoid excessive processing
    if (longChains.length > 100) {
      break
    }
  }

  // Identify prototype pollution
  const pollution: PollutionResult[] = []
  for (const [_, candidate] of pollutionCandidates) {
    if (candidate.affectedObjects.length > PROTOTYPE_POLLUTION_THRESHOLD) {
      pollution.push({
        ...candidate,
        affectedObjectCount: candidate.affectedObjects.length,
        isLikelyPollution: true,
        severity: calculatePollutionSeverity(candidate),
      })
    }
  }

  const statistics = calculateChainStatistics(chainLengths)
  const suspicious = detectSuspiciousPatterns(longChains, pollution)

  return {
    detailedResults,
    longChains,
    pollution,
    statistics,
    suspicious,
  }
}

/**
 * Analyzes a single node's prototype chain
 */
const analyzeNodePrototypeChain = (
  node: ParsedNode,
  edgeMap: Map<number, readonly ParsedEdge[]>,
  nodeMap: Map<number, ParsedNode>,
): ChainAnalysisResult => {
  const chain: ChainEntry[] = []
  const prototypeProperties: PrototypeProperty[] = []
  const suspiciousProperties: SuspiciousProperty[] = []
  let currentNode: ParsedNode | undefined = node
  let chainLength = 0
  const visited = new Set<number>()

  while (currentNode && chainLength < 50) {
    // Prevent infinite loops
    if (visited.has(currentNode.id)) {
      // Circular reference detected!
      suspiciousProperties.push({
        message: 'Circular prototype reference detected',
        nodeId: currentNode.id,
        type: 'circular_reference',
      })
      break
    }

    visited.add(currentNode.id)
    chain.push({
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      nodeType: currentNode.type,
    })

    // Find prototype edge - ONLY follow 'property' type edges with __proto__ name
    const edges = edgeMap.get(currentNode.id) || []
    const prototypeEdge = edges.find((edge) => edge.type === 'property' && edge.nameOrIndex === '__proto__')

    if (prototypeEdge) {
      const targetNodeId = prototypeEdge.toNode
      const prototypeNode = nodeMap.get(targetNodeId)
      if (prototypeNode) {
        // Check for unusual properties on this prototype
        const prototypeEdges = edgeMap.get(prototypeNode.id) || []
        for (const edge of prototypeEdges) {
          // Only check property-type edges for suspicious properties
          if (edge.type === 'property' && isUnusualPrototypeProperty(edge.nameOrIndex)) {
            prototypeProperties.push({
              propertyName: edge.nameOrIndex,
              prototypeId: prototypeNode.id,
              prototypeName: prototypeNode.name,
            })

            suspiciousProperties.push({
              message: `Unusual property "${edge.nameOrIndex}" found on prototype "${prototypeNode.name}"`,
              propertyName: edge.nameOrIndex,
              prototypeName: prototypeNode.name,
              type: 'unusual_prototype_property',
            })
          }
        }

        currentNode = prototypeNode
        chainLength++
      } else {
        break
      }
    } else {
      break
    }
  }

  return {
    chain,
    length: chainLength,
    prototypeProperties,
    suspiciousProperties,
  }
}

/**
 * Creates a map for quick node lookups
 */
const createNodeMap = (parsedNodes: readonly ParsedNode[]): Map<number, ParsedNode> => {
  const nodeMap = new Map<number, ParsedNode>()
  for (const node of parsedNodes) {
    nodeMap.set(node.id, node)
  }
  return nodeMap
}

/**
 * Creates a map of node IDs to their properly typed edges
 */
const createEdgeMap = (parsedNodes: readonly ParsedNode[], parsedEdges: readonly ParsedEdge[]): Map<number, ParsedEdge[]> => {
  const edgeMap = new Map<number, ParsedEdge[]>()

  // Initialize empty arrays for all nodes
  for (const node of parsedNodes) {
    edgeMap.set(node.id, [])
  }

  // Group edges by their source node
  let edgeIndex = 0
  for (const node of parsedNodes) {
    const nodeEdges: ParsedEdge[] = []
    for (let i = 0; i < node.edgeCount; i++) {
      const edge = parsedEdges[edgeIndex++]
      if (edge) {
        nodeEdges.push(edge)
      }
    }
    edgeMap.set(node.id, nodeEdges)
  }

  return edgeMap
}

/**
 * Checks if a node is a JavaScript object that should have a prototype
 * Filters out V8 internal objects that don't have meaningful prototype chains
 */
const isObjectWithPrototype = (node: ParsedNode): boolean => {
  // Only analyze actual JavaScript objects
  if (node.type !== 'object') {
    return false
  }

  // Filter out V8 internal objects that don't have prototype chains
  const internalPrefixes = [
    'system /',
    '(constant pool)',
    '(', // Most internal objects start with parentheses
    'system',
    'hidden',
    'native',
    'builtin',
  ]

  // Skip V8 internal objects
  if (internalPrefixes.some((prefix) => node.name.startsWith(prefix))) {
    return false
  }

  // Focus on user JavaScript objects
  return node.type === 'object'
}

/**
 * Identifies properties that shouldn't normally be on prototypes
 */
const isUnusualPrototypeProperty = (propertyName: string): boolean => {
  const normalProperties = new Set([
    'constructor',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
    'length',
    'push',
    'pop',
    'slice',
    'splice',
    'indexOf',
    'forEach',
  ])

  // Properties that might indicate pollution
  const suspiciousPatterns = [
    'isAdmin',
    'isAuthenticated',
    'isLoggedIn',
    'user',
    'session',
    'polluted',
    'hacked',
    'exploit',
    'payload',
    'eval',
    'script',
  ]

  return (
    !normalProperties.has(propertyName) &&
    (suspiciousPatterns.some((pattern) => propertyName.includes(pattern)) || propertyName.includes('__') || propertyName.includes('_'))
  )
}

/**
 * Calculates statistics about prototype chain lengths
 */
const calculateChainStatistics = (chainLengths: readonly number[]): AnalysisStatistics => {
  if (chainLengths.length === 0) {
    return { average: 0, count: 0, max: 0, median: 0, min: 0, percentile95: 0 }
  }

  const sorted = [...chainLengths].sort((a, b) => a - b)

  // Avoid spread operator for large arrays - use reduce instead
  const max = chainLengths.reduce((max, current) => Math.max(max, current), 0)
  const min = chainLengths.reduce((min, current) => Math.min(min, current), Number.MAX_SAFE_INTEGER)

  return {
    average: chainLengths.reduce((sum, len) => sum + len, 0) / chainLengths.length,
    count: chainLengths.length,
    max,
    median: sorted[Math.floor(sorted.length / 2)],
    min,
    percentile95: sorted[Math.floor(sorted.length * 0.95)],
  }
}

/**
 * Calculates severity of prototype pollution
 */
const calculatePollutionSeverity = (candidate: PollutionCandidate): string => {
  const count = candidate.affectedObjects.length
  const propertyName = candidate.propertyName.toLowerCase()

  // Security-related properties are high severity
  if (
    propertyName.includes('admin') ||
    propertyName.includes('auth') ||
    propertyName.includes('user') ||
    propertyName.includes('session')
  ) {
    return 'critical'
  }

  if (count > 10_000) return 'high'
  if (count > 5000) return 'medium'
  return 'low'
}

/**
 * Detects suspicious patterns in prototype chains
 */
const detectSuspiciousPatterns = (longChains: readonly LongChainResult[], pollution: readonly PollutionResult[]) => {
  const patterns = {
    deepInheritance: longChains.filter((chain) => chain.chainLength > 15),
    performanceIssues: longChains.filter((chain) => chain.chainLength > 20),
    possibleFrameworkIssue: longChains.filter((chain) =>
      chain.prototypeChain.some((p) => p.nodeName.includes('Component') || p.nodeName.includes('Mixin')),
    ),
    securityIssues: pollution.filter((p) => p.severity === 'critical'),
  }

  return patterns
}
