import * as Assert from '../Assert/Assert.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as SetupTestWithCallback from '../SetupTestWithCallback/SetupTestWithCallback.ts'

export const setupTest = async ({
  absolutePath,
  connectionId,
  forceRun,
  isGithubActions,
  timeouts,
}: {
  absolutePath: string
  connectionId: number
  forceRun: boolean
  isGithubActions: boolean
  timeouts: boolean
}) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.boolean(isGithubActions)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const result = await SetupTestWithCallback.setupTestWithCallback({
    absolutePath,
    forceRun,
    isGithubActions,
    pageObject,
  })
  return result
}
