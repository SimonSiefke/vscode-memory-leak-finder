import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getInstanceCountMap = async (session, objectGroup, objects) => {
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const instances = this

  const map = new Map()

  for(const instance of instances){
    if(map.has(instance.constructor)){
      map.set(instance.constructor, map.get(instance.constructor) + 1)
    } else {
      map.set(instance.constructor, 1)
    }
  }
  return map
}`,
    objectId: objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  return fnResult1
}
