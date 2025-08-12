import * as Assert from '../Assert/Assert.ts'
import * as DisableTimeouts from '../DisableTimeouts/DisableTimeouts.ts'
import * as ElectronAppState from '../ElectronAppState/ElectronAppState.ts'
import * as Expect from '../Expect/Expect.ts'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForFirstWindow from '../WaitForFirstWindow/WaitForFirstWindow.ts'

// TODO move this into 3 separate functions
// 1. import pageobject module
// 2. wait for first window
// 3. create pageObject
// 4. ask pageObject to check that window is ready
//
// steps and and 2 can be done in parallel

export const create = async (connectionId, isFirstConnection, isHeadless, timeouts, parsedIdeVersion, pageObjectPath) => {
  try {
    Assert.number(connectionId)
    Assert.boolean(isFirstConnection)
    Assert.boolean(timeouts)
    Assert.object(parsedIdeVersion)
    Assert.string(pageObjectPath)
    const { pageObjectModule } = PageObjectState.get(connectionId)
    const electronApp = ElectronAppState.get(connectionId)
    ElectronAppState.remove(connectionId)
    const firstWindow = await WaitForFirstWindow.waitForFirstWindow({
      electronApp,
      isFirstConnection,
      isHeadless,
    })
    const pageObjectContext = {
      page: firstWindow,
      expect: Expect.expect,
      VError,
      electronApp,
      ideVersion: parsedIdeVersion,
    }
    const pageObject = await pageObjectModule.create(pageObjectContext)
    await pageObject.WaitForApplicationToBeReady.waitForApplicationToBeReady()
    PageObjectState.set(connectionId, { pageObject, firstWindow })
    if (timeouts === false) {
      await DisableTimeouts.disableTimeouts(firstWindow)
    }
  } catch (error) {
    throw new VError(error, `Failed to create page object`)
  }
}
