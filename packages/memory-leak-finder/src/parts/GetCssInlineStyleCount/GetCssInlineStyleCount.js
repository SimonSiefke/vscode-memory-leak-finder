import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCssInlineStyleCount = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const objects = this

const getNodeInlineStyles = (node) => {
  try {
    const styleArray = [...node.style]
    return styleArray
  } catch {
    return []
  }
}

const getNodesInlineStyles = (nodes) => {
  return nodes.flatMap(getNodeInlineStyles)
}

const getTotalInlineStyleCount = (nodes) => {
  const inlineStyles = getNodesInlineStyles(nodes)
  const total = inlineStyles.length
  return total
}

const totalCount = getTotalInlineStyleCount(objects)
return totalCount
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
