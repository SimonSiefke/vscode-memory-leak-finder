import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

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
      nodeDescription: getNodeDescription(domListener._node)
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
