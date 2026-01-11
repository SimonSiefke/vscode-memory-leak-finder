import * as Assert from '../Assert/Assert.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.ts'

export const runTest = async (connectionId: number, absolutePath: string, forceRun: boolean, runMode: number, platform: string) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.number(runMode)
  Assert.string(platform)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const result = await RunTestWithCallback.runTestWithCallback(pageObject, absolutePath, forceRun, runMode, platform)
  return result
}
