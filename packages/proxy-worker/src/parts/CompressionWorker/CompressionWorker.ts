import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetCompressionWorkerUrl from '../GetCompressionWorkerUrl/GetCompressionWorkerUrl.ts'

let compressionWorkerRpc: Awaited<ReturnType<typeof NodeWorkerRpcParent.create>> | null = null

export const getCompressionWorker = async (): Promise<Awaited<ReturnType<typeof NodeWorkerRpcParent.create>>> => {
  if (compressionWorkerRpc) {
    return compressionWorkerRpc
  }
  const url = GetCompressionWorkerUrl.getCompressionWorkerUrl()
  compressionWorkerRpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return compressionWorkerRpc
}

export const disposeCompressionWorker = async (): Promise<void> => {
  if (compressionWorkerRpc) {
    await compressionWorkerRpc.dispose()
    compressionWorkerRpc = null
  }
}

