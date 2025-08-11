import * as Assert from '../Assert/Assert.ts'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'

export const importPageObject = async (connectionId, pageObjectPath) => {
  try {
    Assert.string(pageObjectPath)
    const pageObjectModule = await ImportScript.importScript(pageObjectPath)
    PageObjectState.set(connectionId, {
      module: pageObjectModule,
    })
  } catch (error) {
    throw new VError(error, `Failed to import page object`)
  }
}
