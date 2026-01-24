import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const extensionSourceMapWorkerPath = join(Root.root, 'packages', 'extension-source-maps', 'src', 'main.ts')

export const launchExtensionSourceMapWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: extensionSourceMapWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: readonly any[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
