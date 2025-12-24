import * as Assert from '../Assert/Assert.ts'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.ts'
import * as GetFunctionScopeProperty from '../GetFunctionScopeProperty/GetFunctionScopeProperty.ts'
import * as IsDefined from '../IsDefined/IsDefined.ts'
import type { Session } from '../Session/Session.ts'

export const getFunctionScopeProperties = async (session: Session, objectGroup: string) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const objectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  const promises: Promise<any>[] = []
  for (const objectId of objectIds) {
    promises.push(GetFunctionScopeProperty.getFunctionScopeProperty(session, objectGroup, objectId))
  }
  const scopeListsObjectIds = await Promise.all(promises)
  const defined = scopeListsObjectIds.filter(IsDefined.isDefined)
  return defined
}
