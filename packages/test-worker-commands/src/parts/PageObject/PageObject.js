import { join } from 'path'
import * as Assert from '../Assert/Assert.js'
import * as ElectronAppState from '../ElectronAppState/ElectronAppState.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'

const pageObjectPath = join(Root.root, 'packages', 'page-object', 'src', 'main.js')

export const create = async (connectionId) => {
  try {
    Assert.number(connectionId)
    const pageObjectModule = await ImportScript.importScript(pageObjectPath)
    const context = ElectronAppState.get(connectionId)
    ElectronAppState.remove(connectionId)
    const pageObject = pageObjectModule.create(context)
    PageObjectState.set(connectionId, pageObject)
  } catch (error) {
    throw new VError(error, `Failed to create page object`)
  }
}
