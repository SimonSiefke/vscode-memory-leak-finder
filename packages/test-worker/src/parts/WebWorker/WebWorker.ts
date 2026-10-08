import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const waitForWebWorker = async ({ sessionId }: any) => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  const worker = await pageObject.waitForTarget({ index: 0, type: 'worker' })
  return worker
}
