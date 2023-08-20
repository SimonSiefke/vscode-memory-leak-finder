import { join } from 'path'
import * as Assert from '../Assert/Assert.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'

const pageObjectPath = join(Root.root, 'packages', 'page-object', 'src', 'main.js')

export const create = async (context) => {
  try {
    Assert.object(context)
    const pageObjectModule = await ImportScript.importScript(pageObjectPath)
    const pageObject = pageObjectModule.create(context)
    return pageObject
  } catch (error) {
    throw new VError(error, `Failed to create page object`)
  }
}
