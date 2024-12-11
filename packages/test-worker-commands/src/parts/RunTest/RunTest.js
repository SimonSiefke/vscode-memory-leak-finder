import * as Assert from '../Assert/Assert.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.js'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.js'

export const runTest = async (connectionId, absolutePath, forceRun, runMode) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const firstWindow = PageObjectState.getFirstWindow(connectionId)
  const crashInfo = WaitForCrash.waitForCrash(firstWindow)
  const testResultPromise = RunTestWithCallback.runTestWithCallback(pageObject, absolutePath, forceRun, runMode)
  const intermediateResult = await Promise.race([crashInfo.promise, testResultPromise])
  console.log({ intermediateResult })
  if (intermediateResult && intermediateResult.crashed) {
    console.log('throw error')
    throw new Error(`Target crashed`)
  }
  crashInfo.cleanup()
  return intermediateResult
}
