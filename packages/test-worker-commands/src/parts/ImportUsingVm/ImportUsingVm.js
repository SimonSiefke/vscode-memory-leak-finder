import { VError } from '@lvce-editor/verror'
import { readFile } from 'node:fs/promises'
import * as vm from 'node:vm'

const linker = () => {
  throw new Error(`test imports are not allowed when running test in a vm`)
}

/**
 *
 * @param {string} file
 * @returns {Promise<any>}
 */
export const importUsingVm = async (file) => {
  try {
    const content = await readFile(file, 'utf8')
    const context = vm.createContext({
      process: {
        platform: process.platform,
      },
    })
    const module = new vm.SourceTextModule(content, {
      context,
    })
    await module.link(linker)
    await module.evaluate()
    return module.namespace
  } catch (error) {
    throw new VError(error, `Failed to import ${file}`)
  }
}
