import type { AstNode } from '../AstNode/AstNode.ts'
import { compareAsts } from '../CompareAsts/CompareAsts.ts'
import { getIdSet } from '../GetIdSet/GetIdSet.ts'
import { getLocations } from '../GetLocations/GetLocations.ts'
import { getObjectsWithPropertiesInternalAst } from '../GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import { getObjectWithPropertyNodeIndices } from '../GetObjectWithPropertyNodeIndices/GetObjectWithPropertyNodeIndices.ts'
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

// const getLocationMap

export const getAddedObjectsWithPropertiesInternalAst = (
  before: Snapshot,
  after: Snapshot,
  propertyName: string,
  depth: number = 1,
): readonly AstNode[] => {
  console.time('indices')
  // TODO ensure nodes are functions
  const indicesBefore = getObjectWithPropertyNodeIndices(before, propertyName)
  const indicesAfter = getObjectWithPropertyNodeIndices(after, propertyName)
  console.time('locations')
  const locations = getLocations(before, indicesBefore)
  console.timeEnd('locations')
  const added2 = getAdded(before, after, indicesBefore, indicesAfter)
  console.log('field', before.meta.node_fields.length)
  console.log('locs', before.locations.length)
  console.log('locs', before.locations[0])
  console.log('locs', before.locations[4])
  console.log('lengths', indicesBefore.length, indicesAfter.length)
  console.log('added2', added2.length)
  console.timeEnd('indices')
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
