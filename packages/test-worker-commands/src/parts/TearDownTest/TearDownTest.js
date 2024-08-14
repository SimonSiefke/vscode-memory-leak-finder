import * as Assert from '../Assert/Assert.js'
import * as ImportTest from '../ImportTest/ImportTest.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import * as TestStage from '../TestStage/TestStage.js'

export const tearDownTest = async (connectionId, file) => {
  Assert.number(connectionId)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const module = await ImportTest.importTest(file)
  if (module.teardown) {
    return
  }
  await TestStage.teardown(module, pageObject)
}
