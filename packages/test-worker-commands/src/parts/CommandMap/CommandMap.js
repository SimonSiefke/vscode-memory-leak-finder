import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as MemoryLeakFinderCompare from '../MemoryLeakFinderCompare/MemoryLeakFinderCompare.js'
import * as MemoryLeakFinderSetup from '../MemoryLeakFinderSetup/MemoryLeakFinderSetup.js'
import * as MemoryLeakFinderStart from '../MemoryLeakFinderStart/MemoryLeakFinderStart.js'
import * as MemoryLeakFinderStop from '../MemoryLeakFinderStop/MemoryLeakFinderStop.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as SetupTest from '../SetupTest/SetupTest.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const commandMap = {
  [TestWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [TestWorkerCommandType.ConnectElectron]: ConnectElectron.connectElectron,
  [TestWorkerCommandType.MemoryLeakFinderCompare]: MemoryLeakFinderCompare.compare,
  [TestWorkerCommandType.MemoryLeakFinderSetup]: MemoryLeakFinderSetup.setup,
  [TestWorkerCommandType.MemoryLeakFinderStart]: MemoryLeakFinderStart.start,
  [TestWorkerCommandType.MemoryLeakFinderStop]: MemoryLeakFinderStop.stop,
  [TestWorkerCommandType.PageObjectCreate]: PageObject.create,
  [TestWorkerCommandType.RunTest]: RunTest.runTest,
  [TestWorkerCommandType.SetupTest]: SetupTest.setupTest,
}
