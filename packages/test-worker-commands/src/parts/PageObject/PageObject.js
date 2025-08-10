import * as Assert from '../Assert/Assert.js'
import * as DisableTimeouts from '../DisableTimeouts/DisableTimeouts.js'
import * as ElectronAppState from '../ElectronAppState/ElectronAppState.js'
import * as Expect from '../Expect/Expect.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import { VError } from '../VError/VError.js'
import * as WaitForFirstWindow from '../WaitForFirstWindow/WaitForFirstWindow.js'

export const create = async (connectionId, isFirstConnection, isHeadless, timeouts, parsedIdeVersion, pageObjectPath) => {
  try {
    Assert.number(connectionId)
    Assert.boolean(isFirstConnection)
    Assert.boolean(timeouts)
    Assert.object(parsedIdeVersion)
    Assert.string(pageObjectPath)
    const pageObjectModule = await ImportScript.importScript(pageObjectPath)
    const electronApp = ElectronAppState.get(connectionId)
    ElectronAppState.remove(connectionId)

    const firstWindow = await WaitForFirstWindow.waitForFirstWindow({
      electronApp,
      isFirstConnection,
      isHeadless,
      expect: Expect.expect,
    })
    const pageObjectContext = {
      page: firstWindow,
      expect: Expect.expect,
      VError,
      electronApp,
      ideVersion: parsedIdeVersion,
    }
    const pageObject = await pageObjectModule.create(pageObjectContext)
    PageObjectState.set(connectionId, { pageObject, firstWindow })
    if (timeouts === false) {
      await DisableTimeouts.disableTimeouts(firstWindow)
    }
  } catch (error) {
    throw new VError(error, `Failed to create page object`)
  }
}
