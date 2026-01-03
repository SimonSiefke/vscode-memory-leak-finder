import * as Assert from '../Assert/Assert.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as RunTestWithCallback from '../RunTestWithCallback/RunTestWithCallback.ts'

export const runTest = async ({
  absolutePath,
  connectionId,
  forceRun,
  platform,
  runMode,
}: {
  absolutePath: string
  connectionId: number
  forceRun: boolean
  platform: string
  runMode: number
}) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.number(runMode)
  Assert.string(platform)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const result = await RunTestWithCallback.runTestWithCallback({
    absolutePath,
    forceRun,
    pageObject,
    platform,
    runMode,
  })
  return result
}
