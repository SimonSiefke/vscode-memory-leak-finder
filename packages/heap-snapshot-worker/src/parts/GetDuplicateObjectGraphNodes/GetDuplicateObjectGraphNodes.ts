import type {
  DuplicateObjectGraphLimits,
  DuplicateObjectGraphPreview,
  GraphObject,
  GraphProperty,
} from '../DuplicateObjectGraphTypes/DuplicateObjectGraphTypes.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getDuplicateObjectGraphNodes = (snapshot: Snapshot, limits: DuplicateObjectGraphLimits) => {
  const { nodes, edges, strings, meta } = snapshot
  const stride = meta.node_fields.length
  const edgeStride = meta.edge_fields.length
  const typeOffset = meta.node_fields.indexOf('type')
  const nameOffset = meta.node_fields.indexOf('name')
  const idOffset = meta.node_fields.indexOf('id')
  const sizeOffset = meta.node_fields.indexOf('self_size')
  const countOffset = meta.node_fields.indexOf('edge_count')
  const edgeTypeOffset = meta.edge_fields.indexOf('type')
  const edgeNameOffset = meta.edge_fields.indexOf('name_or_index')
  const targetOffset = meta.edge_fields.indexOf('to_node')
  if (
    [stride, edgeStride].includes(0) ||
    [typeOffset, nameOffset, idOffset, sizeOffset, countOffset, edgeTypeOffset, edgeNameOffset, targetOffset].includes(-1)
  ) {
    throw new Error('duplicate-object-graphs: missing required heap snapshot fields')
  }
  const types = meta.node_types[typeOffset]
  const edgeTypes = meta.edge_types[edgeTypeOffset]
  const firstEdges = new Uint32Array(snapshot.node_count + 1)
  for (let i = 0; i < snapshot.node_count; i++) firstEdges[i + 1] = firstEdges[i] + nodes[i * stride + countOffset] * edgeStride
  const name = (ordinal: number) => strings[nodes[ordinal * stride + nameOffset]]
  const type = (ordinal: number) => types[nodes[ordinal * stride + typeOffset]]
  const id = (ordinal: number) => nodes[ordinal * stride + idOffset]
  const size = (ordinal: number) => nodes[ordinal * stride + sizeOffset]
  const internalType = edgeTypes.indexOf('internal')
  const propertyType = edgeTypes.indexOf('property')
  const weakType = edgeTypes.indexOf('weak')
  const internal = (ordinal: number, key: string): number | undefined => {
    for (let edge = firstEdges[ordinal]; edge < firstEdges[ordinal + 1]; edge += edgeStride) {
      if (edges[edge + edgeTypeOffset] === internalType && strings[edges[edge + edgeNameOffset]] === key)
        return edges[edge + targetOffset] / stride
    }
    return undefined
  }
  const objects: GraphObject[] = []
  const objectIndex = new Int32Array(snapshot.node_count).fill(-1)
  let opaqueObjects = 0
  let unverifiedObjects = 0
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    if (type(ordinal) !== 'object') continue
    if (name(ordinal) !== 'Object' || nodes[ordinal * stride + countOffset] > limits.maxProperties + 4) {
      opaqueObjects++
      continue
    }
    const map = internal(ordinal, 'map')
    const prototype = map === undefined ? undefined : internal(map, 'prototype')
    if (prototype === undefined) {
      opaqueObjects++
      continue
    }
    const properties: GraphProperty[] = []
    let opaque = false
    let prototypeEdgeSeen = false
    for (let edge = firstEdges[ordinal]; edge < firstEdges[ordinal + 1]; edge += edgeStride) {
      const edgeType = edges[edge + edgeTypeOffset]
      const key = strings[edges[edge + edgeNameOffset]]
      const target = edges[edge + targetOffset] / stride
      if (edgeType === propertyType) {
        if (key === '__proto__') {
          // V8 emits a synthetic prototype edge as well as an own property of
          // this name. Never silently erase a shadowing __proto__ property.
          if (prototypeEdgeSeen || target !== prototype || type(prototype) !== 'object') {
            opaque = true
            break
          }
          prototypeEdgeSeen = true
          continue
        }
        // Symbol property names are only descriptions in snapshots, not key IDs.
        // Accessor pairs and indexed storage can hide semantically relevant data.
        if (key.startsWith('<symbol') || name(target) === 'system / AccessorPair') {
          opaque = true
          break
        }
        properties.push({ key, target })
      } else if (edgeType !== weakType && (edgeType !== internalType || !['map', 'properties'].includes(key))) {
        opaque = true
        break
      }
    }
    if (opaque || properties.length > limits.maxProperties) {
      opaqueObjects++
      continue
    }
    properties.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    if (properties.some((property, index) => index > 0 && property.key === properties[index - 1].key)) {
      opaqueObjects++
      continue
    }
    if (objects.length >= limits.maxObjects) {
      unverifiedObjects++
      continue
    }
    objectIndex[ordinal] = objects.length
    objects.push({ ordinal, prototype, properties })
  }
  const leafTokens = new Map<number, string>()
  const leaf = (ordinal: number): string => {
    const cached = leafTokens.get(ordinal)
    if (cached !== undefined) return cached
    let token: string
    const nodeType = type(ordinal)
    const nodeName = name(ordinal)
    // Long/rope/sliced strings may be truncated or incompletely exposed. BigInts,
    // functions, arrays, Maps, Sets, symbols, weak collections and native objects
    // likewise remain identity tokens instead of being equated by display name.
    if (nodeType === 'string' && nodeName.length < 1024 && internal(ordinal, 'truncated') === undefined && !nodeName.includes('\ufffd')) {
      token = JSON.stringify(['string', nodeName])
    } else if (nodeType === 'number') {
      const value = internal(ordinal, 'value')
      const text = value === undefined ? undefined : name(value)
      // V8 can print both +0 and -0 as "0". Only Smi zero is unambiguous.
      token =
        text !== undefined && (text !== '0' || nodeName === 'smi number' || nodeName === 'int')
          ? JSON.stringify(['number', text])
          : `<number-${id(ordinal)}>`
    } else {
      token = JSON.stringify(['opaque', nodeType, nodeName, id(ordinal)])
    }
    leafTokens.set(ordinal, token)
    return token
  }
  const preview = (root: number): DuplicateObjectGraphPreview => {
    let remaining = 64
    const ancestors = new Set<number>()
    const visit = (ordinal: number, depth: number): DuplicateObjectGraphPreview => {
      if (remaining-- <= 0) return '<preview limit>'
      const nodeType = type(ordinal)
      const nodeName = name(ordinal)
      if (nodeType === 'string') return nodeName.length > 160 ? `${nodeName.slice(0, 160)}…` : nodeName
      if (nodeType === 'number') {
        const value = internal(ordinal, 'value')
        if (value !== undefined) {
          const text = name(value)
          const number = Number(text)
          return Number.isFinite(number) ? number : text
        }
      }
      const literal = nodeType === 'hidden' ? internal(ordinal, 'to_string') : undefined
      const literalName = literal === undefined ? nodeName : name(literal)
      if (nodeType === 'hidden') {
        if (literalName === 'true') return true
        if (literalName === 'false') return false
        if (literalName === 'null') return null
        if (literalName === 'undefined') return '<undefined>'
      }
      if (ancestors.has(ordinal)) return '<circular>'
      const object = objects[objectIndex[ordinal]]
      const array = nodeType === 'object' && nodeName === 'Array'
      if (object || array) {
        if (depth >= 4) return array ? '<array>' : '<object>'
        ancestors.add(ordinal)
        let value: DuplicateObjectGraphPreview
        if (object) {
          value = Object.fromEntries(object.properties.slice(0, 8).map((property) => [property.key, visit(property.target, depth + 1)]))
        } else {
          const items: DuplicateObjectGraphPreview[] = []
          let truncated = false
          let scanned = 0
          for (let edge = firstEdges[ordinal]; edge < firstEdges[ordinal + 1]; edge += edgeStride) {
            if (++scanned > 128) {
              truncated = true
              break
            }
            if (edgeTypes[edges[edge + edgeTypeOffset]] !== 'element') continue
            const index = edges[edge + edgeNameOffset]
            if (index >= 8) {
              truncated = true
              continue
            }
            while (items.length <= index) items.push(null)
            items[index] = visit(edges[edge + targetOffset] / stride, depth + 1)
          }
          if (truncated) items.push('<more items>')
          value = items
        }
        ancestors.delete(ordinal)
        return value
      }
      return `<${nodeType === 'object' ? nodeName : nodeType}-${id(ordinal)}>`
    }
    return visit(root, 0)
  }
  return { objects, objectIndex, opaqueObjects, unverifiedObjects, leaf, id, size, preview }
}

export type DuplicateObjectGraphNodes = ReturnType<typeof getDuplicateObjectGraphNodes>
