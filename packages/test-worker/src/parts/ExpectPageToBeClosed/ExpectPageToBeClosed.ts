import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const toBeClosed = async (page) => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  await pageObject.waitForTargetToBeClosed(page.targetId)
}
