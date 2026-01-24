import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const sourceMapWorkerPath = join(Root.root, 'packages', 'source-map-coordinator', 'src', 'main.ts')

export const launchSourceMapWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: sourceMapWorkerPath,
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
