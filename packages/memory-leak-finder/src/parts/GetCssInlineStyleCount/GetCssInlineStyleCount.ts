import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getCssInlineStyleCount = async (session: Session, objectGroup: string): Promise<number> => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
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
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  return fnResult1
}
