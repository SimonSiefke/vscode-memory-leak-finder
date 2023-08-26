import VError from 'verror'
import * as ImportScript from '../ImportScript/ImportScript.js'

export const importTest = async (file) => {
  try {
    const module = await ImportScript.importScript(file)
    return module
  } catch (error) {
    throw new VError(error, `Failed to import test ${file}`)
  }
}
