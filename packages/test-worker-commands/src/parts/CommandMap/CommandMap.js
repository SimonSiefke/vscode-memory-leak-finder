import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as SetupTest from '../SetupTest/SetupTest.js'
import * as TearDownTest from '../TearDownTest/TearDownTest.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const commandMap = {
  [TestWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [TestWorkerCommandType.ConnectElectron]: ConnectElectron.connectElectron,
  [TestWorkerCommandType.PageObjectCreate]: PageObject.create,
  [TestWorkerCommandType.RunTest]: RunTest.runTest,
  [TestWorkerCommandType.SetupTest]: SetupTest.setupTest,
  [TestWorkerCommandType.TearDownTest]: TearDownTest.tearDownTest,
}
