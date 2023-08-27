import * as Assert from '../Assert/Assert.js'
import * as ElectronAppState from '../ElectronAppState/ElectronAppState.js'
import * as Expect from '../Expect/Expect.js'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import { VError } from '../VError/VError.js'
import * as WaitForVsCodeToBeReady from '../WaitForVsCodeToBeReady/WaitForVsCodeToBeReady.js'

export const create = async (connectionId, isFirstConnection) => {
  try {
    Assert.number(connectionId)
    Assert.boolean(isFirstConnection)
    const pageObjectPath = GetPageObjectPath.getPageObjectPath()
    const pageObjectModule = await ImportScript.importScript(pageObjectPath)
    const electronApp = ElectronAppState.get(connectionId)
    ElectronAppState.remove(connectionId)
    const firstWindow = await electronApp.firstWindow()
    if (isFirstConnection) {
      await WaitForVsCodeToBeReady.waitForVsCodeToBeReady({
        page: firstWindow,
        expect: Expect.expect,
      })
    }
    const pageObjectContext = {
      page: firstWindow,
      expect: Expect.expect,
      VError,
      electronApp,
    }
    const pageObject = pageObjectModule.create(pageObjectContext)
    PageObjectState.set(connectionId, { pageObject, firstWindow })
  } catch (error) {
    throw new VError(error, `Failed to create page object`)
  }
}
