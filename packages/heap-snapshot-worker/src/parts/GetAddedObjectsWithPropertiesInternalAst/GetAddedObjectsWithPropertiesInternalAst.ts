import { snapshot } from 'node:test'
import type { AstNode } from '../AstNode/AstNode.ts'
import { compareAsts } from '../CompareAsts/CompareAsts.ts'
import { getIdSet } from '../GetIdSet/GetIdSet.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import { getObjectsWithPropertiesInternalAst } from '../GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import { getObjectWithPropertyNodeIndices2 } from '../GetObjectWithPropertyNodeIndices2/GetObjectWithPropertyNodeIndices2.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getLocationsMap } from '../GetLocationsMap/GetLocationsMap.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { buildAstForNode } from '../GetNodePreviews/GetNodePreviewsAst.ts'
import { signatureFor } from '../SignatureForAstNode/SignatureForAstNode.ts'
import { getObjectWithPropertyNodeIndices3 } from '../GetObjectWithPropertyNodeIndices3/GetObjectWithPropertyNodeIndices3.ts'

const getAdded = (
  before: Snapshot,
  after: Snapshot,
  indicesBefore: readonly number[],
  indicesAfter: readonly number[],
): readonly number[] => {
  const beforeIdSet = getIdSet(before, indicesBefore)
  const added: number[] = []
  const idIndex = after.meta.node_fields.indexOf('id')
  const nodeFieldCount = after.meta.node_fields.length
  if (idIndex === -1) {
    throw new Error(`id not found`)
  }
  for (let i = 0; i < indicesAfter.length; i++) {
    const actualIndex = indicesAfter[i] * nodeFieldCount
    const id = after.nodes[actualIndex + idIndex]
    if (!beforeIdSet.has(id)) {
      added.push(indicesAfter[i])
    }
  }
  return added
}

interface HashMap {
  readonly [key: string]: readonly number[]
}

const createHashMap = (snapshot: Snapshot, indices: Uint32Array): HashMap => {
  const hashMap = Object.create(null)
  const locationMap = getLocationsMap(snapshot)
  const scriptIdIndex = snapshot.meta.location_fields.indexOf('script_id')
  const lineIndex = snapshot.meta.location_fields.indexOf('line')
  const columnIndex = snapshot.meta.location_fields.indexOf('column')
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]
    // TODO location is wrong -> should compare location of property node instead of node location
    const locationIndex = locationMap[index]
    const scriptId = snapshot.locations[locationIndex + scriptIdIndex]
    const line = snapshot.locations[locationIndex + lineIndex]
    const column = snapshot.locations[locationIndex + columnIndex]
    const hash = getLocationKey(scriptId, line, column)
    if (hash in hashMap) {
      hashMap[hash].push(index)
    } else {
      hashMap[hash] = [index]
    }
  }
  return hashMap
}

interface HashMapCompareResult {
  readonly key: string
  readonly before: readonly number[]
  readonly after: readonly number[]
  readonly delta: number
}

const compareMaps = (beforeMap: HashMap, afterMap: HashMap): readonly HashMapCompareResult[] => {
  const leaked: HashMapCompareResult[] = []
  for (const [key, after] of Object.entries(afterMap)) {
    const before = beforeMap[key] || []
    if (after.length > before.length) {
      leaked.push({
        key,
        before,
        after,
        delta: after.length - before.length,
      })
    }
  }
  return leaked
}

const formatComparison = (
  beforeSnapshot: Snapshot,
  afterSnapshot: Snapshot,
  compareResult: readonly HashMapCompareResult[],
): readonly any[] => {
  const pretty: any[] = []
  const nameIndex = afterSnapshot.meta.node_fields.indexOf('name')
  const nodeFieldCount = afterSnapshot.meta.node_fields.length
  const idIndex = afterSnapshot.meta.node_fields.indexOf('id')
  for (const { key, before, after } of compareResult) {
    const beforeIds = before.map((index) => {
      return beforeSnapshot.nodes[index * nodeFieldCount + idIndex]
    })
    // TODO must compare ids
    for (const index of after) {
      const nodeId = afterSnapshot.nodes[index * nodeFieldCount + idIndex]
      if (beforeIds.includes(nodeId)) {
        continue
      }
      const node = afterSnapshot.nodes[index * nodeFieldCount + nameIndex]
      const nodeName = afterSnapshot.strings[node]
      pretty.push({
        key,
        nodeName,
        nodeId,
        index,
        count: after.length,
        beforeCount: before.length,
      })
    }
  }
  return pretty
}

const sortLeaked = (leaked: readonly HashMapCompareResult[]): readonly HashMapCompareResult[] => {
  return leaked.toSorted((a, b) => {
    return b.delta - a.delta
  })
}

const getIds = (snapshot: Snapshot, indices: Uint32Array): Uint32Array => {
  const nodes = snapshot.nodes
  const nodeFieldCount = snapshot.meta.node_fields.length
  const nodeIdIndex = snapshot.meta.node_fields.indexOf('id')
  if (nodeIdIndex === -1) {
    throw new Error('index must be available')
  }
  const ids: number[] = []
  for (let i = 0; i < indices.length; i++) {
    const id = nodes[indices[i] + nodeIdIndex]
    ids.push(id)
  }
  return new Uint32Array(ids)
}

const getAddedIndices = (indices: Uint32Array, ids: Uint32Array, idsOther: Uint32Array): Uint32Array => {
  const added: number[] = []
  const set = new Set(idsOther)
  for (let i = 0; i < indices.length; i++) {
    const id = ids[i]
    if (!set.has(id)) {
      added.push(indices[i])
    }
  }
  return new Uint32Array(added)
}

const getAst = (snapshot: Snapshot, uniqueIndices: Uint32Array, depth: number): readonly any[] => {
  const { nodes, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  console.time('edgeMap')
  const edgeMap = createEdgeMap(nodes, nodeFields)
  console.timeEnd('edgeMap')
  const strings = snapshot.strings
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')

  const asts: AstNode[] = []
  for (const nodeIndex of uniqueIndices) {
    const ast = buildAstForNode(
      nodeIndex,
      snapshot,
      edgeMap,
      nodeFields,
      nodeTypes,
      edgeFields,
      strings,
      ITEMS_PER_NODE,
      ITEMS_PER_EDGE,
      edgeCountFieldIndex,
      edgeTypeFieldIndex,
      edgeNameFieldIndex,
      edgeToNodeFieldIndex,
      EDGE_TYPE_PROPERTY,
      EDGE_TYPE_INTERNAL,
      depth,
      new Set(),
    )
    if (ast) {
      asts.push(ast)
    }
  }

  return asts
}

const getSignatures = (asts: readonly AstNode[], depth: number): readonly string[] => {
  const signatures: string[] = []
  for (const ast of asts) {
    signatures.push(signatureFor(ast, depth))
  }
  return signatures
}

const getUniqueAfter = (
  astBefore: readonly AstNode[],
  astAfter: readonly AstNode[],
  signaturesBefore: readonly string[],
  signaturesAfter: readonly string[],
): readonly AstNode[] => {
  const leaked: AstNode[] = []
  for (let i = 0; i < astAfter.length; i++) {
    if (!signaturesBefore.includes(signaturesAfter[i])) {
      leaked.push(astAfter[i])
    }
  }
  return leaked
}

export const getAddedObjectsWithPropertiesInternalAst = (
  before: Snapshot,
  after: Snapshot,
  propertyName: string,
  depth: number = 1,
): readonly AstNode[] => {
  // TODO ensure nodes are functions
  console.time('indices')
  const indicesBefore = getObjectWithPropertyNodeIndices3(before, propertyName)
  const indicesAfter = getObjectWithPropertyNodeIndices3(after, propertyName)
  console.timeEnd('indices')

  console.log({ indicesBefore: indicesBefore.length, indicesAfter: indicesAfter.length })

  const idsBefore = getIds(before, indicesBefore)
  const idsAfter = getIds(after, indicesAfter)

  console.log({ idsBefore, idsAfter })

  console.time('unqiue')
  const uniqueIndicesBefore = getAddedIndices(indicesBefore, idsBefore, idsAfter)
  const uniqueIndicesAfter = getAddedIndices(indicesAfter, idsAfter, idsBefore)
  console.timeEnd('unqiue')

  console.time('ast')
  const astBefore = getAst(before, uniqueIndicesBefore, depth)
  const astAfter = getAst(after, uniqueIndicesAfter, depth)
  console.timeEnd('ast')

  const signaturesBefore = getSignatures(astBefore, depth)
  const signaturesAfter = getSignatures(astAfter, depth)

  const uniqueAfter = getUniqueAfter(astBefore, astAfter, signaturesBefore, signaturesAfter)
  console.log({ uniqueAfter: uniqueAfter.length })
  console.log('id is not included in before')

  return uniqueAfter
}
