import type { AstNode, ObjectNode } from '../AstNode/AstNode.ts'
import { formatAsts } from '../FormatAsts/FormatAsts.ts'
import { getAsts } from '../GetAsts/GetAsts.ts'
import { getObjectWithPropertyNodeIndices3 } from '../GetObjectWithPropertyNodeIndices3/GetObjectWithPropertyNodeIndices3.ts'
import { signatureFor } from '../SignatureForAstNode/SignatureForAstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

const getIds = (snapshot: Snapshot, indices: Uint32Array): Uint32Array => {
  const nodes = snapshot.nodes
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
  astBefore: readonly ObjectNode[],
  astAfter: readonly ObjectNode[],
  signaturesBefore: readonly string[],
  signaturesAfter: readonly string[],
): readonly ObjectNode[] => {
  const leaked: ObjectNode[] = []
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
  includeProperties: boolean = true,
  collapseNodes: boolean = false,
): readonly AstNode[] => {
  console.time('indices')
  const indicesBefore = getObjectWithPropertyNodeIndices3(before, propertyName)
  const indicesAfter = getObjectWithPropertyNodeIndices3(after, propertyName)
  console.timeEnd('indices')

  console.time('ast')
  const astBeforeAll = getAsts(before, indicesBefore, depth)
  const astAfterAll = getAsts(after, indicesAfter, depth)
  console.timeEnd('ast')

  // Build id sets to prefer truly new instances when selecting deltas
  const beforeIds = getIds(before, indicesBefore)
  const setBeforeIds = new Set(beforeIds)

  // Use shallow signatures (depth 0) for stable identity across snapshots
  const signaturesBefore = getSignatures(astBeforeAll, 0)
  const signaturesAfter = getSignatures(astAfterAll, 0)

  const countMapBefore: Record<string, number> = Object.create(null)
  for (const sig of signaturesBefore) {
    if (sig in countMapBefore) {
      countMapBefore[sig]++
    } else {
      countMapBefore[sig] = 1
    }
  }

  const groupedAfter: Record<string, ObjectNode[]> = Object.create(null)
  for (let i = 0; i < signaturesAfter.length; i++) {
    const sig = signaturesAfter[i]
    const node = astAfterAll[i]
    if (sig in groupedAfter) {
      groupedAfter[sig].push(node)
    } else {
      groupedAfter[sig] = [node]
    }
  }

  const addedAsts: ObjectNode[] = []
  for (const sig in groupedAfter) {
    const afterCount = groupedAfter[sig].length
    const beforeCount = countMapBefore[sig] || 0
    if (afterCount > beforeCount) {
      const delta = afterCount - beforeCount
      const nodes = groupedAfter[sig]
      // First prefer nodes whose ids were not seen before
      const preferred: ObjectNode[] = []
      const fallback: ObjectNode[] = []
      for (const n of nodes) {
        if (setBeforeIds.has(n.id)) {
          fallback.push(n)
        } else {
          preferred.push(n)
        }
      }
      let added = 0
      for (const n of preferred) {
        if (added >= delta) {
          break
        }
        addedAsts.push(n)
        added++
      }
      if (added < delta) {
        for (const n of fallback) {
          if (added >= delta) {
            break
          }
          addedAsts.push(n)
          added++
        }
      }
    }
  }

  const formatted = formatAsts(addedAsts, includeProperties, collapseNodes)
  return formatted
}
