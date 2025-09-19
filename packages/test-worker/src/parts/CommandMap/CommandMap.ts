import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as ImportPageObject from '../ImportPageObject/ImportPageObject.ts'
import * as PageObject from '../PageObject/PageObject.ts'
import * as RunTest from '../RunTest/RunTest.ts'
import * as SetupTest from '../SetupTest/SetupTest.ts'
import * as TearDownTest from '../TearDownTest/TearDownTest.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const commandMap = {
  [TestWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [TestWorkerCommandType.ImportPageObjectModule]: ImportPageObject.importPageObject,
  [TestWorkerCommandType.PageObjectCreate]: PageObject.create,
  [TestWorkerCommandType.RunTest]: RunTest.runTest,
  [TestWorkerCommandType.SetupTest]: SetupTest.setupTest,
  [TestWorkerCommandType.TearDownTest]: TearDownTest.tearDownTest,
}
