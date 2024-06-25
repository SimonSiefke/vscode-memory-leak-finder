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
  const actualResult = result.result
  return actualResult.filter(isArrayScopeValue).map(parseScopeValue)
}

const getScopeValues = async (session, objectGroup, objectId) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    generatePreview: true,
    ownProperties: true,
  })
  const scopeValues = parseScopeValues(rawResult)
  return scopeValues
}

const mergeScopeArrayValues = (scopeArrayValues) => {
  Assert.array(scopeArrayValues)
  const merged = []
  for (const scopeArrayValue of scopeArrayValues) {
    merged.push(...scopeArrayValue)
  }
  return merged
}

const getNameMap = (scopeValues) => {
  Assert.array(scopeValues)
  const map = Object.create(null)
  for (const scopeValue of scopeValues) {
    map[scopeValue.objectId] = scopeValue.name
  }
  return map
}

export const getArrayNameMap = async (session, objectGroup) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const functionObjectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  const scopeLists = await GetAllScopePropertiesInternal.getAllScopePropertiesInternal(session, objectGroup, functionObjectIds)
  const scopeArrayPromises = []
  for (const scopeList of scopeLists) {
    scopeArrayPromises.push(getScopeValues(session, objectGroup, scopeList.objectId))
  }
  const scopeArrayValues = await Promise.all(scopeArrayPromises)
  const mergedScopeArrays = mergeScopeArrayValues(scopeArrayValues)
  const map = getNameMap(mergedScopeArrays)
  return map
}
