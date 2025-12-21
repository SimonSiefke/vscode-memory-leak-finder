import * as Exit from '../Exit/Exit.ts'
import * as RunTests from '../RunTests/RunTests.ts'
import * as TestCoordinatorCommandType from '../TestCoordinatorCommandType/TestCoordinatorCommandType.ts'

export const commandMap = {
  [TestCoordinatorCommandType.Exit]: Exit.exit,
  [TestCoordinatorCommandType.PrepareExit]: Exit.prepare,
  [TestCoordinatorCommandType.RunTests]: RunTests.runTests,
}
