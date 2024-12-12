import * as Assert from '../Assert/Assert.js'
import * as GetFunctionScopeProperty from '../GetFunctionScopeProperty/GetFunctionScopeProperty.js'
import * as IsDefined from '../IsDefined/IsDefined.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

const BATCH_SIZE = 25

const processBatch = async (session, objectGroup, objectIds, startIndex) => {
  const promises = []
  const endIndex = Math.min(startIndex + BATCH_SIZE, objectIds.length)
  for (let i = startIndex; i < endIndex; i++) {
    promises.push(GetFunctionScopeProperty.getFunctionScopeProperty(session, objectGroup, objectIds[i]))
  }
  const result = await Promise.all(promises)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  await new Promise((r) => {
    setTimeout(r, 10)
  })
  return result
}

export const getFunctionScopeProperties = async (session, objectGroup, objectIds) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  const results = []
  for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
    console.log('process batch', i, 'of', objectIds.length)
    const inner = ObjectGroupId.create()
    const batchResults = await processBatch(session, inner, objectIds, i)

    results.push(...batchResults)
  }
  const filtered = results.filter(IsDefined.isDefined)
  return filtered
}
