import { readFile } from 'node:fs/promises'
import * as vm from 'node:vm'

/**
 *
 * @param {string} file
 * @returns {Promise<any>}
 */
export const importUsingVm = async (file) => {
  const content = await readFile(file, 'utf8')
  const module = new vm.SourceTextModule(content)
  // @ts-ignore
  await module.link(() => {})
  await module.evaluate()
  return module.namespace
}
