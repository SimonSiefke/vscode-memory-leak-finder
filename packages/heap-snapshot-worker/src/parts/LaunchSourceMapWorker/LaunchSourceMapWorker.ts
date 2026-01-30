import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getSourceMapCoordinatorPath } from '../SourceMapWorkerPath/SourceMapWorkerPath.ts'

export const launchSourceMapCoordinator = async () => {
  const workerPath: string = getSourceMapCoordinatorPath()

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
