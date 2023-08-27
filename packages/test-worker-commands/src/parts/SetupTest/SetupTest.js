import * as Assert from '../Assert/Assert.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as SetupTestWithCallback from '../SetupTestWithCallback/SetupTestWithCallback.js'

export const setupTest = async (connectionId, absolutePath) => {
  Assert.number(connectionId)
  Assert.string(absolutePath)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const skipped = await SetupTestWithCallback.setupTestWithCallback(pageObject, absolutePath)
  return skipped
}
