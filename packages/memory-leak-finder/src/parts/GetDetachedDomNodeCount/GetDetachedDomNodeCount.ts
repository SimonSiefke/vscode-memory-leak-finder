import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getDetachedDomNodeCount = async (session: Session, objectGroup: string): Promise<number> => {
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

const isGarbageCollected = node => {
  try {
    node.nodeType
    return false
  } catch (error) {
    return true
  }
}

const getAllNodes = (root) => {
  const iter = document.createNodeIterator(
    document.documentElement,
    NodeFilter.SHOW_ALL
  )
  const list = []
  let node
  while ((node = iter.nextNode())) {
    list.push(node)
  }
  return list
}

const getDetachedNodes = (nodes) => {
  const list = getAllNodes()
  const detached = []
  for (const node of nodes) {
    if (list.includes(node) || isGarbageCollected(node)) {
      continue
    }
    detached.push(node)
  }
  return detached
}

const detachedNodes = getDetachedNodes(objects)
return detachedNodes.length
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })

  return fnResult1
}
