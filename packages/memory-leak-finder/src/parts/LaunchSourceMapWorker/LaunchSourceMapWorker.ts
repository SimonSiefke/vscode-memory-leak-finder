import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

<<<<<<< HEAD
const sourceMapWorkerPath = join(Root.root, 'packages', 'source-map-coordinator', 'src', 'main.ts')

export const launchSourceMapCoordinator = async (resolveExtensionSourceMaps: boolean) => {
=======
const workerPath = join(Root.root, 'packages', 'source-map-coordinator', 'src', 'main.ts')

export const launchSourceMapCoordinator = async () => {
>>>>>>> origin/main
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: workerPath,
    stdio: 'inherit',
  })
  await rpc.invoke('Config.setResolveExtensionSourceMaps', resolveExtensionSourceMaps)
  return {
    invoke(method: string, ...params: readonly any[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
