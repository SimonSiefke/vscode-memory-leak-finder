import * as Assert from '../Assert/Assert.js'
import * as ElectronAppState from '../ElectronAppState/ElectronAppState.js'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import { VError } from '../VError/VError.js'

export const create = async (connectionId) => {
  try {
    Assert.number(connectionId)
    const pageObjectPath = GetPageObjectPath.getPageObjectPath()
    const pageObjectModule = await ImportScript.importScript(pageObjectPath)
    const context = ElectronAppState.get(connectionId)
    ElectronAppState.remove(connectionId)
    const pageObject = pageObjectModule.create(context)
    PageObjectState.set(connectionId, pageObject)
  } catch (error) {
    throw new VError(error, `Failed to create page object`)
  }
}
