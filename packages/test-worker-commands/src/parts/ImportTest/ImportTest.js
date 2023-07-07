import { basename, dirname, join } from 'path'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as Root from '../Root/Root.js'
import { cp, mkdir } from 'fs/promises'

const temporaryFiles = join(Root.root, '.vscode-test-files')

export const importTest = async (start, file) => {
  // workarounf for reloading esmodules, this is a memort leak
  const destination = join(temporaryFiles, `${start}`, basename(file))
  await mkdir(dirname(destination), { recursive: true })
  await cp(file, destination)
  const module = await ImportScript.importScript(destination)
  return module
}
