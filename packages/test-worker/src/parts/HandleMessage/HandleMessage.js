import { join } from 'path'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as Root from '../Root/Root.js'
// @ts-ignore
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

const getModule = async () => {
  const testWorkerCommandsPath = join(Root.root, '..', '..', 'test-worker-commands', 'src', 'main.js')
  const module = await ImportScript.importScript(testWorkerCommandsPath)
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
