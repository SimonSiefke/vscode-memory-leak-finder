import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetAllScopePropertiesInternal from '../GetAllScopePropertiesInternal/GetAllScopePropertiesInternal.js'

const parseScopeValue = (rawScopeValue) => {
  return {
    name: rawScopeValue.name,
    objectId: rawScopeValue.value.objectId,
  }
}

const isArrayScopeValue = (rawScopeValue) => {
  return rawScopeValue.value.type === 'object'
}

const parseScopeValues = (result) => {
  Assert.array(result)
  return result.filter(isArrayScopeValue).map(parseScopeValue)
}

const getScopeValues = async (session, objectId) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    generatePreview: true,
    ownProperties: true,
  })
  const scopeValues = parseScopeValues(rawResult)
  return scopeValues
}

const getNameMap = (scopeValueArray) => {
  Assert.array(scopeValueArray)
  const map = Object.create(null)
  for (const scopeValue of scopeValueArray) {
    map[scopeValue.objectId] = scopeValue.name
  }
  return map
}

export const getArrayNameMap = async (session, objectGroup) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const functionObjectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  // functionObjectIds.length = 243
  const scopeListsObjectIds = await GetAllScopePropertiesInternal.getAllScopeListPropertiesInternal(session, objectGroup, functionObjectIds)
  const scopeArrayPromises = []
  for (const scopeListObjectId of scopeListsObjectIds) {
    scopeArrayPromises.push(getScopeValues(session, scopeListObjectId))
  }
  const scopeArrayValues = await Promise.all(scopeArrayPromises)
  const mergedScopeArrays = scopeArrayValues.flat(1)
  const map = getNameMap(mergedScopeArrays)
  console.log(JSON.stringify(map, null, 2))
  // return map
  return {}
}
