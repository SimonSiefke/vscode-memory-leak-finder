import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetConstructors from '../GetConstructors/GetConstructors.js'
import * as GetInstances from '../GetInstances/GetInstances.js'

export const getClassCount = async (session, objectGroup) => {
  const instances = await GetInstances.getInstances(session, objectGroup)
  const constructors = await GetConstructors.getConstructors(session, objectGroup, instances.objectId)
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function (){
  const constructors = this
  return constructors.length
}`,
    objectGroup,
    objectId: constructors.objectId,
  })
  return fnResult1
}
