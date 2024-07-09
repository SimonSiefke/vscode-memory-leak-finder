import { readFile } from 'node:fs/promises'
import * as vm from 'node:vm'

export const runTest = async (pageObject, file, forceRun) => {
  // TODO use vm
  console.log('use vm')
  const content = await readFile(file, 'utf8')
  const module = new vm.SourceTextModule(content)
  // @ts-ignore
  await module.link(() => {})
  await module.evaluate()
  // const contextifiedObject = vm.createContext({ secret: 42 })
  // await TestStage.run(module, pageObject)
  return false
}
