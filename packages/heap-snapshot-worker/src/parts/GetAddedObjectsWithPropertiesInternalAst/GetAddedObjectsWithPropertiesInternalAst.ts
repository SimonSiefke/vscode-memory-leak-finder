import type { AstNode, ObjectNode } from '../AstNode/AstNode.ts'
import { getAsts } from '../GetAsts/GetAsts.ts'
import { getObjectWithPropertyNodeIndices3 } from '../GetObjectWithPropertyNodeIndices3/GetObjectWithPropertyNodeIndices3.ts'
import { signatureFor } from '../SignatureForAstNode/SignatureForAstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { findClosureLocationsForObjectId } from '../FindClosureLocationsForNode/FindClosureLocationsForNode.ts'

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
  const indicesBefore = getObjectWithPropertyNodeIndices3(before, propertyName)
  const indicesAfter = getObjectWithPropertyNodeIndices3(after, propertyName)

  console.log({ indicesBefore, indicesAfter })

  const idsBefore = getIds(before, indicesBefore)
  const idsAfter = getIds(after, indicesAfter)

  const uniqueIndicesBefore = getAddedIndices(indicesBefore, idsBefore, idsAfter)
  const uniqueIndicesAfter = getAddedIndices(indicesAfter, idsAfter, idsBefore)

  const astBefore = getAsts(before, uniqueIndicesBefore, depth)
  const astAfter = getAsts(after, uniqueIndicesAfter, depth)

  const signaturesBefore = getSignatures(astBefore, depth)
  const signaturesAfter = getSignatures(astAfter, depth)

  const uniqueAfter = getUniqueAfter(astBefore, astAfter, signaturesBefore, signaturesAfter)
  // Enhance leaked objects with approximate closure locations
  const enhanced = uniqueAfter.map((node) => {
    if (node.type === 'object') {
      const locations = findClosureLocationsForObjectId(after, node.id)
      const obj: ObjectNode = locations.length
        ? { ...(node as ObjectNode), closureLocations: locations }
        : (node as ObjectNode)
      return obj
    }
    return node
  })
  return enhanced
}
