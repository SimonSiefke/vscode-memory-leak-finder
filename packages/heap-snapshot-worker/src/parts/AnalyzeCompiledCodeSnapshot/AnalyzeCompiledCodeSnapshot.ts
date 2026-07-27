import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface CodeSizeBreakdown {
  readonly bytecodeBytes: number
  readonly instructionBytes: number
  readonly metadataBytes: number
  readonly totalBytes: number
}

export interface CompiledCodeFunction extends CodeSizeBreakdown {
  readonly column: number
  readonly key: string
  readonly line: number
  readonly name: string
  readonly scriptId: number
}

export interface CompiledCodeTotals extends CodeSizeBreakdown {
  readonly attributedBytes: number
  readonly sharedBytes: number
  readonly unattributedBytes: number
}

export interface CompiledCodeSnapshotAnalysis {
  readonly functions: readonly CompiledCodeFunction[]
  readonly totals: CompiledCodeTotals
}

interface MutableCodeSizeBreakdown {
  bytecodeBytes: number
  instructionBytes: number
  metadataBytes: number
  totalBytes: number
}

interface FunctionLocation {
  readonly column: number
  readonly line: number
  readonly name: string
  readonly scriptId: number
}

const UNSEEN_OWNER = -2
const SHARED_OWNER = -1

const createBreakdown = (): MutableCodeSizeBreakdown => ({
  bytecodeBytes: 0,
  instructionBytes: 0,
  metadataBytes: 0,
  totalBytes: 0,
})

const addNodeSize = (breakdown: MutableCodeSizeBreakdown, name: string, size: number): void => {
  breakdown.totalBytes += size
  if (name.includes('BytecodeArray')) {
    breakdown.bytecodeBytes += size
  } else if (name.includes('InstructionStream')) {
    breakdown.instructionBytes += size
  } else {
    breakdown.metadataBytes += size
  }
}

const isSharedFunctionInfo = (name: string): boolean => {
  return name.includes('SharedFunctionInfo') || name.includes('shared function info')
}

const isScript = (name: string): boolean => {
  return name === '(script)' || name === 'system / Script' || name.startsWith('system / Script /')
}

const shouldFollowCodeEdge = (edgeType: string, edgeName: string, targetName: string): boolean => {
  if (edgeType !== 'internal' && edgeType !== 'hidden') {
    return false
  }
  if (edgeName === 'script' || edgeName === 'outer_scope_info' || edgeName === 'dependent_code') {
    return false
  }
  if (edgeName === 'raw_outer_scope_info_or_feedback_metadata' && targetName.includes('ScopeInfo')) {
    return false
  }
  return !isScript(targetName) && !isSharedFunctionInfo(targetName)
}

const getFunctionKey = ({ column, line, name, scriptId }: FunctionLocation): string => {
  return `${scriptId}:${line}:${column}:${name}`
}

export const analyzeCompiledCodeSnapshot = (snapshot: Snapshot): CompiledCodeSnapshotAnalysis => {
  const { edges, locations, meta, nodes, strings } = snapshot
  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types[0]
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0]
  const nodeFieldCount = nodeFields.length
  const edgeFieldCount = edgeFields.length
  const nodeCount = snapshot.node_count

  const nodeTypeOffset = nodeFields.indexOf('type')
  const nodeNameOffset = nodeFields.indexOf('name')
  const nodeSelfSizeOffset = nodeFields.indexOf('self_size')
  const nodeEdgeCountOffset = nodeFields.indexOf('edge_count')
  const edgeTypeOffset = edgeFields.indexOf('type')
  const edgeNameOffset = edgeFields.indexOf('name_or_index')
  const edgeToNodeOffset = edgeFields.indexOf('to_node')
  const codeType = nodeTypes.indexOf('code')
  const closureType = nodeTypes.indexOf('closure')

  if (
    nodeTypeOffset < 0 ||
    nodeNameOffset < 0 ||
    nodeSelfSizeOffset < 0 ||
    nodeEdgeCountOffset < 0 ||
    edgeTypeOffset < 0 ||
    edgeNameOffset < 0 ||
    edgeToNodeOffset < 0 ||
    codeType < 0 ||
    closureType < 0
  ) {
    throw new Error('heap snapshot is missing compiled-code metadata')
  }

  const codeIndexByOrdinal = new Int32Array(nodeCount)
  codeIndexByOrdinal.fill(-1)
  let codeCount = 0
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    const nodeOffset = ordinal * nodeFieldCount
    if (nodes[nodeOffset + nodeTypeOffset] === codeType) {
      codeIndexByOrdinal[ordinal] = codeCount++
    }
  }

  const codeOrdinals = new Uint32Array(codeCount)
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    const codeIndex = codeIndexByOrdinal[ordinal]
    if (codeIndex >= 0) {
      codeOrdinals[codeIndex] = ordinal
    }
  }

  const { columnOffset, itemsPerLocation, lineOffset, objectIndexOffset, scriptIdOffset } = getLocationFieldOffsets(
    meta.location_fields,
  )
  if (columnOffset < 0 || lineOffset < 0 || objectIndexOffset < 0 || scriptIdOffset < 0) {
    throw new Error('heap snapshot is missing function location metadata')
  }

  const locationIndexByOrdinal = new Int32Array(nodeCount)
  locationIndexByOrdinal.fill(-1)
  for (let offset = 0; offset < locations.length; offset += itemsPerLocation) {
    const ordinal = locations[offset + objectIndexOffset] / nodeFieldCount
    if (ordinal < nodeCount) {
      locationIndexByOrdinal[ordinal] = offset
    }
  }

  const adjacencyCounts = new Uint32Array(codeCount)
  const functionIndexByKey = new Map<string, number>()
  const functionLocations: FunctionLocation[] = []
  const seedsByFunction: number[][] = []
  let relevantEdgeCount = 0
  let edgeOffset = 0

  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    const nodeOffset = ordinal * nodeFieldCount
    const nodeType = nodes[nodeOffset + nodeTypeOffset]
    const outgoingEdgeCount = nodes[nodeOffset + nodeEdgeCountOffset]
    const codeIndex = codeIndexByOrdinal[ordinal]
    const locationOffset = locationIndexByOrdinal[ordinal]
    const isLocatedClosure = nodeType === closureType && locationOffset >= 0
    let closureSharedCodeIndex = -1
    const closureSeeds: number[] = []

    for (let index = 0; index < outgoingEdgeCount; index++, edgeOffset += edgeFieldCount) {
      const targetOrdinal = edges[edgeOffset + edgeToNodeOffset] / nodeFieldCount
      const targetCodeIndex = codeIndexByOrdinal[targetOrdinal]
      if (targetCodeIndex < 0) {
        continue
      }
      const edgeType = edgeTypes[edges[edgeOffset + edgeTypeOffset]]
      const rawEdgeName = edges[edgeOffset + edgeNameOffset]
      const edgeName = edgeType === 'element' || edgeType === 'hidden' ? String(rawEdgeName) : strings[rawEdgeName]

      if (isLocatedClosure && edgeType === 'internal') {
        if (edgeName === 'shared') {
          closureSharedCodeIndex = targetCodeIndex
        } else if (edgeName === 'code' || edgeName === 'feedback_cell') {
          closureSeeds.push(targetCodeIndex)
        }
      }

      if (codeIndex >= 0) {
        const targetNodeOffset = targetOrdinal * nodeFieldCount
        const targetName = strings[nodes[targetNodeOffset + nodeNameOffset]]
        if (shouldFollowCodeEdge(edgeType, edgeName, targetName)) {
          adjacencyCounts[codeIndex]++
          relevantEdgeCount++
        }
      }
    }

    if (closureSharedCodeIndex < 0 || locationOffset < 0) {
      continue
    }
    const location: FunctionLocation = {
      column: locations[locationOffset + columnOffset],
      line: locations[locationOffset + lineOffset],
      name: strings[nodes[nodeOffset + nodeNameOffset]],
      scriptId: locations[locationOffset + scriptIdOffset],
    }
    const key = getFunctionKey(location)
    let functionIndex = functionIndexByKey.get(key)
    if (functionIndex === undefined) {
      functionIndex = functionLocations.length
      functionIndexByKey.set(key, functionIndex)
      functionLocations.push(location)
      seedsByFunction.push([])
    }
    seedsByFunction[functionIndex].push(closureSharedCodeIndex, ...closureSeeds)
  }

  const adjacencyOffsets = new Uint32Array(codeCount + 1)
  for (let codeIndex = 0; codeIndex < codeCount; codeIndex++) {
    adjacencyOffsets[codeIndex + 1] = adjacencyOffsets[codeIndex] + adjacencyCounts[codeIndex]
  }
  const adjacencyTargets = new Uint32Array(relevantEdgeCount)
  const adjacencyWriteOffsets = adjacencyOffsets.slice(0, codeCount)
  edgeOffset = 0
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    const nodeOffset = ordinal * nodeFieldCount
    const outgoingEdgeCount = nodes[nodeOffset + nodeEdgeCountOffset]
    const codeIndex = codeIndexByOrdinal[ordinal]
    for (let index = 0; index < outgoingEdgeCount; index++, edgeOffset += edgeFieldCount) {
      if (codeIndex < 0) {
        continue
      }
      const targetOrdinal = edges[edgeOffset + edgeToNodeOffset] / nodeFieldCount
      const targetCodeIndex = codeIndexByOrdinal[targetOrdinal]
      if (targetCodeIndex < 0) {
        continue
      }
      const edgeType = edgeTypes[edges[edgeOffset + edgeTypeOffset]]
      const rawEdgeName = edges[edgeOffset + edgeNameOffset]
      const edgeName = edgeType === 'element' || edgeType === 'hidden' ? String(rawEdgeName) : strings[rawEdgeName]
      const targetNodeOffset = targetOrdinal * nodeFieldCount
      const targetName = strings[nodes[targetNodeOffset + nodeNameOffset]]
      if (shouldFollowCodeEdge(edgeType, edgeName, targetName)) {
        adjacencyTargets[adjacencyWriteOffsets[codeIndex]++] = targetCodeIndex
      }
    }
  }

  const owners = new Int32Array(codeCount)
  owners.fill(UNSEEN_OWNER)
  const seenGeneration = new Uint32Array(codeCount)
  const stack: number[] = []
  for (let functionIndex = 0; functionIndex < seedsByFunction.length; functionIndex++) {
    const generation = functionIndex + 1
    stack.length = 0
    for (const seed of seedsByFunction[functionIndex]) {
      if (seenGeneration[seed] !== generation) {
        seenGeneration[seed] = generation
        stack.push(seed)
      }
    }
    while (stack.length > 0) {
      const current = stack.pop()!
      const previousOwner = owners[current]
      if (previousOwner === UNSEEN_OWNER) {
        owners[current] = functionIndex
      } else if (previousOwner !== functionIndex) {
        owners[current] = SHARED_OWNER
      }
      for (let offset = adjacencyOffsets[current]; offset < adjacencyOffsets[current + 1]; offset++) {
        const target = adjacencyTargets[offset]
        if (seenGeneration[target] !== generation) {
          seenGeneration[target] = generation
          stack.push(target)
        }
      }
    }
  }

  const functionBreakdowns = functionLocations.map(createBreakdown)
  const totalBreakdown = createBreakdown()
  let attributedBytes = 0
  let sharedBytes = 0
  let unattributedBytes = 0
  for (let codeIndex = 0; codeIndex < codeCount; codeIndex++) {
    const ordinal = codeOrdinals[codeIndex]
    const nodeOffset = ordinal * nodeFieldCount
    const name = strings[nodes[nodeOffset + nodeNameOffset]]
    const size = nodes[nodeOffset + nodeSelfSizeOffset]
    addNodeSize(totalBreakdown, name, size)
    const owner = owners[codeIndex]
    if (owner >= 0) {
      attributedBytes += size
      addNodeSize(functionBreakdowns[owner], name, size)
    } else if (owner === SHARED_OWNER) {
      sharedBytes += size
    } else {
      unattributedBytes += size
    }
  }

  const functions = functionLocations.map((location, index): CompiledCodeFunction => ({
    ...functionBreakdowns[index],
    ...location,
    key: getFunctionKey(location),
  }))

  return {
    functions,
    totals: {
      ...totalBreakdown,
      attributedBytes,
      sharedBytes,
      unattributedBytes,
    },
  }
}
