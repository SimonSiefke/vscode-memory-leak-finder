import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.ts'
import * as GetAllScopePropertiesInternal from '../GetAllScopePropertiesInternal/GetAllScopePropertiesInternal.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.ts'

const parseChildScopeValue = (rawScopeValue) => {
  return {
    name: rawScopeValue.name,
    objectId: rawScopeValue.value.objectId,
  }
}

const isArrayScopeValue = (rawScopeValue) => {
  return rawScopeValue.value.type === 'object' && rawScopeValue.value.subtype === 'array'
}

const getScopeChildValues = async (session: Session, objectId: string) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId,
    ownProperties: true,
  })
  const ownProperties = rawResult.result.filter(IsEnumerable.isEnumerable).filter(isArrayScopeValue).map(parseChildScopeValue)
  return ownProperties
}

const getScopeValues = async (session: Session, objectId: string) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId,
    ownProperties: true,
  })
  const descriptorValues = GetDescriptorValues.getDescriptorValues(rawResult)
  const childPromises: Promise<any>[] = []
  for (const descriptor of descriptorValues) {
    childPromises.push(getScopeChildValues(session, descriptor.objectId))
  }
  const childScopeArrays = await Promise.all(childPromises)
  return childScopeArrays
}

export const getArrayNameMap = async (session: Session, objectGroup: string) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const functionObjectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  const scopeListsObjectIds = await GetAllScopePropertiesInternal.getAllScopeListPropertiesInternal(session, objectGroup, functionObjectIds)
  const scopeArrayPromises: Promise<any[]>[] = []
  for (const scopeListObjectId of scopeListsObjectIds) {
    scopeArrayPromises.push(getScopeValues(session, scopeListObjectId))
  }
  return {}
}
