import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getSourceMapWorkerPath } from '../SourceMapWorkerPath/SourceMapWorkerPath.ts'

export const launchSourceMapWorker = async () => {
  const sourceMapWorkerPath: string = getSourceMapWorkerPath()

  const rpc = await NodeWorkerRpcParent.create({
    stdio: 'inherit',
    path: sourceMapWorkerPath,
    commandMap: {},
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
