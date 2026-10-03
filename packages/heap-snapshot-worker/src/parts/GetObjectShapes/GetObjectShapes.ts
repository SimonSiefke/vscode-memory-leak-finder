import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface ObjectShape {
  readonly constructorName: string
  readonly elementsKind: string
  readonly instanceCount: number
  readonly properties: readonly string[]
  readonly prototypeName: string
  readonly shapeCount: number
  readonly signature: string
}

interface MutableShape {
  readonly constructorName: string
  readonly elementsKind: string
  instanceCount: number
  readonly properties: string[]
  readonly prototypeName: string
  shapeCount: number
  readonly signature: string
}

export const getObjectShapes = (snapshot: Snapshot): readonly ObjectShape[] => {
  const nodeFields = snapshot.meta.node_fields
  const edgeFields = snapshot.meta.edge_fields
  const nodeFieldCount = nodeFields.length
  const edgeFieldCount = edgeFields.length
  const typeOffset = nodeFields.indexOf('type')
  const nameOffset = nodeFields.indexOf('name')
  const edgeCountOffset = nodeFields.indexOf('edge_count')
  const edgeTypeOffset = edgeFields.indexOf('type')
  const edgeNameOffset = edgeFields.indexOf('name_or_index')
  const edgeToNodeOffset = edgeFields.indexOf('to_node')
  const nodeTypes = snapshot.meta.node_types[0] || []
  const edgeTypes = snapshot.meta.edge_types[0] || []
  const objectType = nodeTypes.indexOf('object')
  const objectShapeType = nodeTypes.indexOf('object shape')
  const internalType = edgeTypes.indexOf('internal')
  const firstEdgeIndexes = new Uint32Array(snapshot.node_count + 1)
  let edgeIndex = 0
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    firstEdgeIndexes[ordinal] = edgeIndex
    edgeIndex += snapshot.nodes[ordinal * nodeFieldCount + edgeCountOffset] * edgeFieldCount
  }
  firstEdgeIndexes[snapshot.node_count] = edgeIndex

  const getNodeName = (ordinal: number): string => snapshot.strings[snapshot.nodes[ordinal * nodeFieldCount + nameOffset]] || ''
  const getNodeType = (ordinal: number): number => snapshot.nodes[ordinal * nodeFieldCount + typeOffset]
  const findInternalTarget = (ordinal: number, expectedName: string): number | undefined => {
    for (let index = firstEdgeIndexes[ordinal]; index < firstEdgeIndexes[ordinal + 1]; index += edgeFieldCount) {
      if (snapshot.edges[index + edgeTypeOffset] !== internalType) {
        continue
      }
      const name = snapshot.strings[snapshot.edges[index + edgeNameOffset]]
      if (name === expectedName) {
        return snapshot.edges[index + edgeToNodeOffset] / nodeFieldCount
      }
    }
    return undefined
  }

  const shapeByMap = new Map<number, MutableShape>()
  const shapeBySignature = new Map<string, MutableShape>()
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    if (getNodeType(ordinal) !== objectType) {
      continue
    }
    const mapOrdinal = findInternalTarget(ordinal, 'map')
    if (mapOrdinal === undefined || getNodeType(mapOrdinal) !== objectShapeType || getNodeName(mapOrdinal) !== 'system / Map') {
      continue
    }
    let shape = shapeByMap.get(mapOrdinal)
    if (!shape) {
      const properties: string[] = []
      const descriptorsOrdinal = findInternalTarget(mapOrdinal, 'descriptors')
      if (descriptorsOrdinal !== undefined) {
        for (let index = firstEdgeIndexes[descriptorsOrdinal]; index < firstEdgeIndexes[descriptorsOrdinal + 1]; index += edgeFieldCount) {
          if (snapshot.edges[index + edgeTypeOffset] !== internalType) {
            continue
          }
          const slotName = snapshot.strings[snapshot.edges[index + edgeNameOffset]]
          const slot = Number(slotName)
          if (!Number.isInteger(slot) || slot % 3 !== 0) {
            continue
          }
          const propertyOrdinal = snapshot.edges[index + edgeToNodeOffset] / nodeFieldCount
          const propertyType = nodeTypes[getNodeType(propertyOrdinal)]
          if (propertyType === 'string' || propertyType === 'symbol') {
            properties.push(getNodeName(propertyOrdinal))
          }
        }
      }
      const prototypeOrdinal = findInternalTarget(mapOrdinal, 'prototype')
      const elementsKindOrdinal = findInternalTarget(mapOrdinal, 'elements_kind_name')
      const constructorName = getNodeName(ordinal)
      const prototypeName = prototypeOrdinal === undefined ? '' : getNodeName(prototypeOrdinal)
      const elementsKind = elementsKindOrdinal === undefined ? '' : getNodeName(elementsKindOrdinal)
      const signature = JSON.stringify([constructorName, prototypeName, elementsKind, properties])
      shape = { constructorName, elementsKind, instanceCount: 0, properties, prototypeName, shapeCount: 1, signature }
      shapeByMap.set(mapOrdinal, shape)
      const existing = shapeBySignature.get(signature)
      if (existing) {
        existing.shapeCount++
        shape = existing
        shapeByMap.set(mapOrdinal, existing)
      } else {
        shapeBySignature.set(signature, shape)
      }
    }
    shape.instanceCount++
  }
  return [...shapeBySignature.values()].sort((a, b) => b.shapeCount - a.shapeCount || a.signature.localeCompare(b.signature))
}
