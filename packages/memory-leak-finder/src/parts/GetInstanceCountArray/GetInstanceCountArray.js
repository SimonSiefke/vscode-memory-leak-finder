import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getInstanceCountArray = async (session, objectGroup, map) => {
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const map = this
  const array = []

  for(const [instanceConstructor, count] of map.entries()){
    array.push({
      name: instanceConstructor.name,
      count,
    })
  }

  return array
}`,
    objectId: map.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
