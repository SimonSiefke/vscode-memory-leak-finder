import * as Assert from '../Assert/Assert.js'
import * as GetFunctionLocation from '../GetFunctionLocation/GetFunctionLocation.js'

const BATCH_SIZE = 50

const processBatch = async (session, objectIds, startIndex) => {
  const promises = []
  const endIndex = Math.min(startIndex + BATCH_SIZE, objectIds.length)

  for (let i = startIndex; i < endIndex; i++) {
    promises.push(GetFunctionLocation.getFunctionLocation(session, objectIds[i]))
  }

  return Promise.all(promises)
}

export const getFunctionLocations = async (session, objectIds) => {
  Assert.object(session)
  Assert.array(objectIds)

  const results = []

  for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
    const batchResults = await processBatch(session, objectIds, i)
    results.push(...batchResults)
  }

  return results
}
