import * as Assert from '../Assert/Assert.ts'
import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const tearDownTest = async (connectionId, file) => {
  Assert.number(connectionId)
  const pageObject = PageObjectState.getPageObject(connectionId)
  const module = await ImportTest.importTest(file)
  await TestStage.teardown(module, pageObject)
}
