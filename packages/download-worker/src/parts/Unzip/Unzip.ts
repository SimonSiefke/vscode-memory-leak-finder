import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

const compressionWorkerUrl = join(root, 'packages', 'compression-worker', 'bin', 'compression-worker.js')

const launchCompressionWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    path: compressionWorkerUrl,
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

export const unzip = async (inFile: string, outDir: string): Promise<void> => {
  await using rpc = await launchCompressionWorker()
  await rpc.invoke('Compression.unzip', inFile, outDir)
}
