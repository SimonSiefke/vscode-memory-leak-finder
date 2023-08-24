import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const commandMap = {
  [TestWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [TestWorkerCommandType.ConnectElectron]: ConnectElectron.connectElectron,
  [TestWorkerCommandType.PageObjectCreate]: PageObject.create,
  [TestWorkerCommandType.RunTest]: RunTest.runTest,
}
