import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetCryptographyWorkerUrl from '../GetCryptographyWorkerUrl/GetCryptographyWorkerUrl.ts'

let cryptographyWorkerRpc: Awaited<ReturnType<typeof NodeWorkerRpcParent.create>> | null = null

export const getCryptographyWorker = async (): Promise<Awaited<ReturnType<typeof NodeWorkerRpcParent.create>>> => {
  if (cryptographyWorkerRpc) {
    return cryptographyWorkerRpc
  }
  const url = GetCryptographyWorkerUrl.getCryptographyWorkerUrl()
  cryptographyWorkerRpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return cryptographyWorkerRpc
}

export const disposeCryptographyWorker = async (): Promise<void> => {
  if (cryptographyWorkerRpc) {
    await cryptographyWorkerRpc.dispose()
    cryptographyWorkerRpc = null
  }
}
