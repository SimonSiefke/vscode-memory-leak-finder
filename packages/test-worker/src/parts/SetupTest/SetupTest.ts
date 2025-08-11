import * as Assert from '../Assert/Assert.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as SetupTestWithCallback from '../SetupTestWithCallback/SetupTestWithCallback.ts'

export const setupTest = async (connectionId, absolutePath, forceRun) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const skipped = await SetupTestWithCallback.setupTestWithCallback(pageObject, absolutePath, forceRun)
  return skipped
}
