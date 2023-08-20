import { join } from 'path'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as Root from '../Root/Root.js'
import * as TestWorkerCommandType from '../TestCoordinatorCommandType/TestCoordinatorCommandType.js'

const getModule = async () => {
  const testCoordinatorCommandsPath = join(Root.root, '..', '..', 'test-coordinator-commands', 'src', 'main.js')
  const module = await ImportScript.importScript(testCoordinatorCommandsPath)
  return module
}

export const getFn = async (method) => {
  const module = await getModule()
  switch (method) {
    case TestWorkerCommandType.RunTest:
      return module.runTest
    case TestWorkerCommandType.RunTests:
      return module.runTests
    case TestWorkerCommandType.Exit:
      return module.exit
    default:
      throw new Error(`unexpected method ${method}`)
  }
}
