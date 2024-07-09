import { readFile } from 'node:fs/promises'
import * as vm from 'node:vm'
import * as TestStage from '../TestStage/TestStage.js'

export const runTest = async (pageObject, file, forceRun) => {
  const content = await readFile(file, 'utf8')
  const module = new vm.SourceTextModule(content)
  // @ts-ignore
  await module.link(() => {})
  await module.evaluate()

  // @ts-ignore
  if (module.namespace.skip) {
    return true
  }
  await TestStage.run(module.namespace, pageObject)
  return false
}
