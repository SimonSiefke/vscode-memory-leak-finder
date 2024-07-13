import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetAllScopePropertiesInternal from '../GetAllScopePropertiesInternal/GetAllScopePropertiesInternal.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.js'

const parseChildScopeValue = (rawScopeValue) => {
  return {
    name: rawScopeValue.name,
    objectId: rawScopeValue.value.objectId,
  }
}

const isArrayScopeValue = (rawScopeValue) => {
  return rawScopeValue.value.type === 'object' && rawScopeValue.value.subtype === 'array'
}

const getScopeChildValues = async (session, objectId) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const ownProperties = rawResult.result.filter(IsEnumerable.isEnumerable).filter(isArrayScopeValue).map(parseChildScopeValue)
  return ownProperties
}

const getScopeValues = async (session, objectId) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const descriptorValues = GetDescriptorValues.getDescriptorValues(rawResult)
  const childPromises = []
  for (const descriptor of descriptorValues) {
    childPromises.push(getScopeChildValues(session, descriptor.objectId))
  }
  const childScopeArrays = await Promise.all(childPromises)
  return childScopeArrays
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
  const scopeListsObjectIds = await GetAllScopePropertiesInternal.getAllScopeListPropertiesInternal(session, objectGroup, functionObjectIds)
  const scopeArrayPromises = []
  for (const scopeListObjectId of scopeListsObjectIds) {
    scopeArrayPromises.push(getScopeValues(session, scopeListObjectId))
  }
  const scopeArrayValues = await Promise.all(scopeArrayPromises)
  return {}
}
