import * as Assert from '../Assert/Assert.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.js'

export const runTest = async (connectionId, absolutePath, forceRun, runMode) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const skipped = await RunTestWithCallback.runTestWithCallback(pageObject, absolutePath, forceRun, runMode)
  return skipped
}
