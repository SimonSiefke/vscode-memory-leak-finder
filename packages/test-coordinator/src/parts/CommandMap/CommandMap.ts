import * as TestCoordinatorCommandType from '../TestCoordinatorCommandType/TestCoordinatorCommandType.ts'
import * as RunTests from '../RunTests/RunTests.ts'
import * as Exit from '../Exit/Exit.ts'

export const commandMap = {
  [TestCoordinatorCommandType.RunTests]: RunTests.runTests,
  [TestCoordinatorCommandType.Exit]: Exit.exit,
  [TestCoordinatorCommandType.PrepareExit]: Exit.prepare,
}
