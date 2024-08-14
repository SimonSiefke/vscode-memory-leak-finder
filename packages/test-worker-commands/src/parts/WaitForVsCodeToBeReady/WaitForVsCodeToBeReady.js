import * as IsDevtoolsCannotFindContextError from '../IsDevtoolsCannotFindContextError/IsDevtoolsCannotFindContextError.js'
import * as PageEventState from '../PageEventState/PageEventState.js'
import * as PageEventType from '../PageEventType/PageEventType.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

export const waitForVsCodeToBeReady = async ({ electronApp, isHeadless, isFirstConnection, expect }) => {
  const firstWindow = await electronApp.firstWindow()
  if (isFirstConnection) {
    await PageEventState.waitForEvent({
      frameId: firstWindow.targetId,
      name: isHeadless ? PageEventType.NetworkIdle : PageEventType.InteractiveTime,
      timeout: TimeoutConstants.InteractiveTime,
    })
    try {
      const main = firstWindow.locator('[role="main"]')
      await expect(main).toBeVisible({
        timeout: 30_000,
      })
    } catch (error) {
      if (IsDevtoolsCannotFindContextError.isDevtoolsCannotFindContextError(error)) {
        // ignore and try again
        const main = firstWindow.locator('[role="main"]')
        await expect(main).toBeVisible({
          timeout: 30_000,
        })
        return firstWindow
      } else {
        throw error
      }
    }
    const settingsIcon = firstWindow.locator('[aria-label="Manage"]')
    await expect(settingsIcon).toBeVisible()
    // const notification = firstWindow.locator('text=All installed extensions are temporarily disabled.')
    // await expect(notification).toBeVisible({
    // timeout: 15_000,
    // })
  }
  return firstWindow
}
