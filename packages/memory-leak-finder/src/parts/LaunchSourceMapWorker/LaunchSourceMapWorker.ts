import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const workerPath = join(Root.root, 'packages', 'source-map-coordinator', 'src', 'main.ts')

export const launchSourceMapCoordinator = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: workerPath,
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
