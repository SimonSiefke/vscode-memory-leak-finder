import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getExtensionSourceMapWorkerPath } from '../GetExtensionSourceMapWorkerPath/GetExtensionSourceMapWorkerPath.ts'

export const launchExtensionSourceMapWorker = async () => {
  const extensionSourceMapWorkerPath: string = getExtensionSourceMapWorkerPath()

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
