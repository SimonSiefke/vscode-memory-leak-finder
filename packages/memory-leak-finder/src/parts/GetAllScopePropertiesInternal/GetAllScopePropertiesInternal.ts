import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetScopeProperties from '../GetFunctionScopeProperty/GetFunctionScopeProperty.ts'

const isDefined = (value) => {
  return value !== ''
}

export const getAllScopeListPropertiesInternal = async (session: Session, objectGroup: string, objectIds: readonly any[]) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  const promises: Promise<any>[] = Array.from(objectIds, (objectId) =>
    GetScopeProperties.getFunctionScopeProperty(session, objectGroup, objectId),
  )
  const scopeProperties = await Promise.all(promises)
  const actualScopeProperties = scopeProperties.filter(isDefined)
  return actualScopeProperties
}
