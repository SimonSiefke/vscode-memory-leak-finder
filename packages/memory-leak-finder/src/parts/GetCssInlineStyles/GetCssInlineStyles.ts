import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCssInlineStyles = async (session, objectGroup) => {
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

const createCountMap = (array) => {
  const map = Object.create(null)
  for(const item of array){
    map[item] ||= 0
    map[item]++
  }
  return map
}

const getTotalInlineStyleCount = (nodes) => {
  const inlineStyles = nodes.flatMap(getNodeInlineStyles)
  const countMap = createCountMap(inlineStyles)
  return countMap
}

const countMap = getTotalInlineStyleCount(objects)
return countMap
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
