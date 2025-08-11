import * as PageEventState from '../PageEventState/PageEventState.ts'
import * as PageEventType from '../PageEventType/PageEventType.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'

export const waitForFirstWindow = async ({ electronApp, isHeadless, isFirstConnection }) => {
  const firstWindow = await electronApp.firstWindow()
  if (isFirstConnection) {
    await PageEventState.waitForEvent({
      frameId: firstWindow.targetId,
      name: isHeadless ? PageEventType.NetworkIdle : PageEventType.InteractiveTime,
      timeout: TimeoutConstants.InteractiveTime,
    })
  }
  return firstWindow
}
