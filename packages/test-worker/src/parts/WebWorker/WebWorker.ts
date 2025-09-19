import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const waitForWebWorker = async ({ sessionId }) => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  const worker = await pageObject.waitForTarget({ type: 'worker', index: 0 })
  return worker
}
