import { join } from 'node:path'
// @ts-ignore
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as Root from '../Root/Root.js'
import * as TestCoordinatorCommandType from '../TestCoordinatorCommandType/TestCoordinatorCommandType.js'

const getModule = async () => {
  const testCoordinatorCommandsPath = join(Root.root, '..', '..', 'test-coordinator-commands', 'src', 'main.js')
  const module = await ImportScript.importScript(testCoordinatorCommandsPath)
  return module
}

export const getFn = async (method) => {
  const module = await getModule()
  switch (method) {
    case TestCoordinatorCommandType.RunTest:
      return module.runTest
    case TestCoordinatorCommandType.RunTests:
      return module.runTests
    case TestCoordinatorCommandType.Exit:
      return module.exit
    default:
      throw new Error(`unexpected method ${method}`)
  }
}
