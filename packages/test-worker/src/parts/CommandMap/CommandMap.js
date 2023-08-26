import { join } from 'path'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as Root from '../Root/Root.js'

export const load = async () => {
  const testWorkerCommandsPath = join(Root.root, '..', '..', 'test-worker-commands', 'src', 'main.js')
  const module = await ImportScript.importScript(testWorkerCommandsPath)
  const { commandMap } = module
  return commandMap
}
