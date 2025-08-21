import type { AstNode } from '../AstNode/AstNode.ts'
import { compareAsts } from '../CompareAsts/CompareAsts.ts'
import { getIdSet } from '../GetIdSet/GetIdSet.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import { getObjectsWithPropertiesInternalAst } from '../GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import { getObjectWithPropertyNodeIndices2 } from '../GetObjectWithPropertyNodeIndices2/GetObjectWithPropertyNodeIndices2.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

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

const createHashMap = (indices: Uint32Array): HashMap => {
  const hashMap = Object.create(null)
  for (let i = 0; i < indices.length; i += 4) {
    const index = indices[i]
    const scriptId = indices[i + 1]
    const line = indices[i + 2]
    const column = indices[i + 3]
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

const formatComparison = (beforeSnapshot: Snapshot, afterSnapshot: Snapshot, compareResult: readonly HashMapCompareResult[]): any => {
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
  pretty.sort((a, b) => {
    const aDelta = a.count - a.beforeCount
    const bDelta = b.count - b.beforeCount
    return bDelta - aDelta
  })
  return pretty
}

const sortLeaked = (leaked: readonly HashMapCompareResult[]): readonly HashMapCompareResult[] => {
  return leaked.toSorted((a, b) => {
    return b.delta - a.delta
  })
}

export const getAddedObjectsWithPropertiesInternalAst = (
  before: Snapshot,
  after: Snapshot,
  propertyName: string,
  depth: number = 1,
): readonly AstNode[] => {
  console.time('indices')
  // TODO ensure nodes are functions
  console.time('indices')
  const indicesBefore = getObjectWithPropertyNodeIndices2(before, propertyName)
  const indicesAfter = getObjectWithPropertyNodeIndices2(after, propertyName)
  console.timeEnd('indices')

  console.time('hashmap')
  const hashMapBefore = createHashMap(indicesBefore)
  const hashMapAfter = createHashMap(indicesAfter)
  console.timeEnd('hashmap')

  console.log({ hashMapAfter: hashMapAfter['10:32:16000'] })

  console.time('compareMap')
  const leaked = compareMaps(hashMapBefore, hashMapAfter)
  console.timeEnd('compareMap')

  console.time('sort')
  const leakedSorted = sortLeaked(leaked)
  console.timeEnd('sort')
  const idIndex = after.meta.node_fields.indexOf('id')
  // const nodeFieldCount = after.meta.node_fields.length
  console.log('id', after.nodes[703916 + idIndex])
  // console.log({ leakedSorted })

  const formatted = formatComparison(before, after, leaked)
  // console.log({ formatted })

  // const edgeMap = createEdgeMap(before.nodes, before.meta.node_fields)
  // const nodeFieldCount = before.meta.node_fields.length
  // console.log({ nodeFieldCount, nodeFields: before.meta.node_fields, propertyName })
  // const type = before.nodes[16054 * nodeFieldCount + 0]
  // const name = before.nodes[16054 * nodeFieldCount + 1]
  // const id = before.nodes[16054 * nodeFieldCount + 2]
  // const size = before.nodes[16054 * nodeFieldCount + 3]
  // const edgeCount = before.nodes[16054 * nodeFieldCount + 4]
  // const detachedNess = before.nodes[16054 * nodeFieldCount + 5]
  // const edgeIndex = edgeMap[16054]
  // console.log({
  //   indicesBefore,
  //   indicesAfter,
  //   // type,
  //   // name,
  //   // id,
  //   // size,
  //   // edgeCount,
  //   // detachedNess,
  //   // string: before.strings[676],
  //   // disposeIndex: before.strings.indexOf('dispose'),
  //   // edgeIndex,
  // })
  // console.log({ indicesBefore, indicesAfter })
  // console.time('locationMap')
  // const locationMapBefore = getLocationMap(before, indicesBefore)
  // const locationMapAfter = getLocationMap(after, indicesAfter)
  // console.timeEnd('locationMap')

  // console.time('locations')

  // console.log({ locationMapBefore })

  // const locationsBefore = getLocations(before, indicesBefore, locationMapBefore)
  // const locationsAfter = getLocations(after, indicesAfter, locationMapAfter)

  // const hashesBefore = getLocationHashes(locationsBefore)
  // const hashesAfter = getLocationHashes(locationsAfter)

  // console.log({ hashesBefore, hashesAfter })
  // console.timeEnd('locations')
  // const added2 = getAdded(before, after, indicesBefore, indicesAfter)
  // console.log('field', before.meta.node_fields.length)
  // console.log('locs', before.locations.length)
  // console.log('locs', before.locations[0])
  // console.log('locs', before.locations[4])
  // console.log('lengths', indicesBefore.length, indicesAfter.length)
  // console.log('added2', added2.length)
  // console.timeEnd('indices')
  console.time('ast-before')
  const astBefore = getObjectsWithPropertiesInternalAst(before, propertyName, depth)
  console.timeEnd('ast-before')
  console.time('ast-after')
  const astAfter = getObjectsWithPropertiesInternalAst(after, propertyName, depth)
  console.timeEnd('ast-after')
  console.time('compare')
  const added = compareAsts(astBefore, astAfter, depth)
  console.timeEnd('compare')
  console.log('addedCount', added.length)
  return added
}
