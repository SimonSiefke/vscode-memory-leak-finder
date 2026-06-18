import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetFunctionLocation from '../GetFunctionLocation/GetFunctionLocation.ts'
const BATCH_SIZE = 50
const processBatch = async (session: Session, objectIds: Dynamic, startIndex: Dynamic) => {
  const promises: Promise<Dynamic>[] = []
  const endIndex = Math.min(startIndex + BATCH_SIZE, objectIds.length)
  for (let i = startIndex; i < endIndex; i++) {
    promises.push(GetFunctionLocation.getFunctionLocation(session, objectIds[i]))
  }
  return Promise.all(promises)
}
export const getFunctionLocations = async (session: Session, objectIds: Dynamic) => {
  Assert.object(session)
  Assert.array(objectIds)
  const results: Dynamic[] = []
  for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
    const batchResults = await processBatch(session, objectIds, i)
    results.push(...batchResults)
  }
  return results
}
