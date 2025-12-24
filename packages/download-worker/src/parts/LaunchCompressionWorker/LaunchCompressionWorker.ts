import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

const compressionWorkerUrl = join(root, 'packages', 'compression-worker', 'bin', 'compression-worker.js')

export const launchCompressionWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: compressionWorkerUrl,
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
