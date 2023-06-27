import { join } from 'path'
import { pathToFileURL } from 'url'
import * as Root from '../Root/Root.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

const getModule = async () => {
  const testWorkerCommandsPath = join(Root.root, '..', '..', 'test-worker-commands', 'src', 'main.js')
  const url = pathToFileURL(testWorkerCommandsPath).toString()
  const module = await import(url)
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
