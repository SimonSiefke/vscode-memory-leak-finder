import * as Assert from '../Assert/Assert.js'
import * as GetFunctionLocation from '../GetFunctionLocation/GetFunctionLocation.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const BATCH_SIZE = 500

const processBatch = async (session, objectIds, startIndex) => {
  const promises = []
  const endIndex = Math.min(startIndex + BATCH_SIZE, objectIds.length)

  for (let i = startIndex; i < endIndex; i++) {
    promises.push(GetFunctionLocation.getFunctionLocation(session, objectIds[i], i))
  }

  return Promise.all(promises)
}

export const getFunctionLocations = async (session, objectIds) => {
  Assert.object(session)
  Assert.array(objectIds)

  const results = []

  for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
    console.time('batch' + i)
    const batchResults = await processBatch(session, objectIds, i)

    // give browser some time

    // await DevtoolsProtocolRuntime.evaluate(session, {
    //   expression: `new Promise(resolve => { requestIdleCallback(resolve) })`,
    //   awaitPromise: true,
    // })
    console.timeEnd('batch' + i)
    results.push(...batchResults)
  }

  return results
}
