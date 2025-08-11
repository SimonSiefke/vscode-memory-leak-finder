import { join } from 'path'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as Root from '../Root/Root.ts'

export const load = async () => {
  const testWorkerCommandsPath = join(Root.root, '..', '..', 'test-worker-commands', 'src', 'main.ts')
  const module = await ImportScript.importScript(testWorkerCommandsPath)
  const { commandMap } = module as any
  return commandMap
}
