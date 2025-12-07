import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'

export const buildReferencePathFromEdge = (
  sourceNode: any,
  sourceNodeName: string | null,
  sourceNodeType: string | null,
  edgeTypeName: string,
  edgeNameOrIndex: number,
  strings: readonly string[],
): ReferencePath => {
  const sourceNodeId = sourceNode.id
  let edgeName = ''
  let path = ''

  if (edgeTypeName === 'property') {
    edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
    if (sourceNodeName) {
      path = `${sourceNodeName}.${edgeName}`
    } else {
      path = `[Object ${sourceNodeId}].${edgeName}`
    }
  } else if (edgeTypeName === 'element') {
    edgeName = `[${edgeNameOrIndex}]`
    if (sourceNodeName) {
      path = `${sourceNodeName}${edgeName}`
    } else {
      path = `[Array ${sourceNodeId}]${edgeName}`
    }
  } else if (edgeTypeName === 'context') {
    edgeName = 'context'
    if (sourceNodeName) {
      path = `${sourceNodeName}.context`
    } else {
      path = `[Closure ${sourceNodeId}].context`
    }
  } else if (edgeTypeName === 'internal') {
    edgeName = 'internal'
    if (sourceNodeName) {
      path = `${sourceNodeName}.internal`
    } else {
      path = `[${sourceNodeType} ${sourceNodeId}].internal`
    }
  } else {
    edgeName = edgeTypeName
    if (sourceNodeName) {
      path = `${sourceNodeName}.${edgeTypeName}`
    } else {
      path = `[${sourceNodeType} ${sourceNodeId}].${edgeTypeName}`
    }
  }

  return {
    sourceNodeName,
    sourceNodeType,
    edgeType: edgeTypeName,
    edgeName,
    path,
  }
}
