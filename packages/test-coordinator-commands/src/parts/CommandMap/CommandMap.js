import * as TestCoordinatorCommandType from '../TestCoordinatorCommandType/TestCoordinatorCommandType.js'
import * as RunTests from '../RunTests/RunTests.js'
import * as Exit from '../Exit/Exit.js'

export const commandMap = {
  [TestCoordinatorCommandType.RunTests]: RunTests.runTests,
  [TestCoordinatorCommandType.Exit]: Exit.exit,
}
