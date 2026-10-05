import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetScopeProperties from '../GetFunctionScopeProperty/GetFunctionScopeProperty.ts'
const isDefined = (value: Dynamic) => {
  return value !== ''
}
export const getAllScopeListPropertiesInternal = async (session: Session, objectGroup: string, objectIds: readonly Dynamic[]) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  const promises: Promise<Dynamic>[] = []
  for (const objectId of objectIds) {
    promises.push(GetScopeProperties.getFunctionScopeProperty(session, objectGroup, objectId))
  }
  const scopeProperties = await Promise.all(promises)
  const actualScopeProperties = scopeProperties.filter(isDefined)
  return actualScopeProperties
}
