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
import { getAsts } from '../GetAsts/GetAsts.ts'

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

  console.log({ uniqueIndicesBefore, uniqueIndicesAfter })

  console.time('ast')
  const astBefore = getAsts(before, uniqueIndicesBefore, depth)
  const astAfter = getAsts(after, uniqueIndicesAfter, depth)
  console.timeEnd('ast')

  console.log({ astBefore, astAfter })

  const signaturesBefore = getSignatures(astBefore, depth)
  const signaturesAfter = getSignatures(astAfter, depth)

  const uniqueAfter = getUniqueAfter(astBefore, astAfter, signaturesBefore, signaturesAfter)
  console.log({ uniqueAfter: uniqueAfter.length })
  console.log('id is not included in before')

  return uniqueAfter
}
