import * as GetAllScopePropertiesInternal from '../GetAllScopePropertiesInternal/GetAllScopePropertiesInternal.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetArrayNameMap from '../GetArrayNameMap/GetArrayNameMap.js'

const getAllScopes = async (session, objectGroup) => {
  const scopes = await GetAllScopePropertiesInternal.getAllScopePropertiesInternal(session, objectGroup, functionObjectIds)
  const firstObjectId = scopes[0].objectId
  const scopeListProperties = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: firstObjectId,
    generatePreview: true,
    ownProperties: true,
  })
}

export const getArrays = async (session, objectGroup) => {
  // const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
  //   expression: PrototypeExpression.Array,
  //   returnByValue: false,
  //   objectGroup,
  // })
  // const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
  //   prototypeObjectId: prototypeDescriptor.objectId,
  //   objectGroup,
  // })
  const nameMap = await GetArrayNameMap.getArrayNameMap(session, objectGroup)
  console.log({ nameMap })
  // const functionObjectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  // functionObjectIds.length = 42 // TODO
  // const scopes = await GetAllScopePropertiesInternal.getAllScopePropertiesInternal(session, objectGroup, functionObjectIds)
  // const firstObjectId = scopes[0].objectId
  // const scopeListProperties = await DevtoolsProtocolRuntime.getProperties(session, {
  //   objectId: firstObjectId,
  //   generatePreview: true,
  //   ownProperties: true,
  // })
  // console.log('scope list:')
  // console.log(JSON.stringify(scopeListProperties, null, 2))
  // console.log('end scope list:')
  // const values = scopeListProperties
  //   .map((x) => x.value)
  //   .map((x) => {
  //     return {
  //       type: x.type,
  //       subtype: x.subtype,
  //       objectId: x.objectId,
  //       description: x.preview.description,
  //       properties: x.preview.properties,
  //     }
  //   })
  // for (const scope of values) {
  //   const scopeProperties = await DevtoolsProtocolRuntime.getProperties(session, {
  //     objectId: scope.objectId,
  //     ownProperties: true,
  //     generatePreview: false,
  //   })
  //   console.log(`scope ${scope.objectId}:`)
  //   console.log(JSON.stringify(scopeProperties, null, 2))
  //   console.log('end scope')
  // }
  // console.log(JSON.stringify(values, null, 2))
  //   const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
  //     functionDeclaration: `function(){
  //   const objects = this
  //   let total = 0
  //   for(const object of objects){
  //     total += object.length
  //   }
  //   return total
  // }`,
  //     objectId: objects.objects.objectId,
  //     returnByValue: true,
  //     objectGroup,
  //   })
  return []
}
