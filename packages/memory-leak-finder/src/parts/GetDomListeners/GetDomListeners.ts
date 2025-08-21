import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getDomListeners = async (session, objectGroup) => {
  const instances = await GetConstructorInstances.getConstructorInstances(session, objectGroup, 'DomListener')
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const domListeners = this
  const array = []

  const getNodeDescription = (node) => {
    if(!node){
      return ''
    }
    if(node.className){
      return node.className
    }
    if(node.nodeName){
      node.nodeName.toLowerCase()
    }
    return ''
  }

  for(const domListener of domListeners){
    array.push({
      type: domListener._type,
      handlerName: domListener._handler?.name || 'anonymous',
      nodeDescription: getNodeDescription(domListener._node),
      disposed: domListener._node === null && domListener._handler === null
    })
  }

  return array
}`,
    objectId: instances.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult2
}
