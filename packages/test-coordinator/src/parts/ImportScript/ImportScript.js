import { pathToFileURL } from 'url'
import VError from 'verror'

export const importScript = async (path) => {
  try {
    const url = pathToFileURL(path).toString()
    return await import(url)
  } catch (error) {
    throw new VError(error, `Failed to import ${path}`)
  }
}
