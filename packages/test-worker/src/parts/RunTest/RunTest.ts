import * as Assert from '../Assert/Assert.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.ts'

export const runTest = async (connectionId, absolutePath, forceRun, runMode) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const result = await RunTestWithCallback.runTestWithCallback(pageObject, absolutePath, forceRun, runMode)
  return result
}
