import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getConstructors = async (session, objectGroup, instancesObjectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const instances = this

  const getConstructor = instance => {
    return instance.constructor
  }

  const unique = (array) => {
    const result = []
    for(const element of array){
      if(element && !result.includes(element)){
        result.push(element)
      }
    }
    return result
  }

  const constructors = instances.map(getConstructor)
  const uniqueConstructors = unique(constructors)
  return uniqueConstructors
}`,
    objectGroup,
    objectId: instancesObjectId,
  })
  return fnResult1
}
