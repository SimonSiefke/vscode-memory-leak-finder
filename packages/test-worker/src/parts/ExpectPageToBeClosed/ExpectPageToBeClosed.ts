import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const toBeClosed = async (page) => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObject(connectionId)
  await pageObject.waitForTargetToBeClosed(page.targetId)
}
