import { NodeWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'
import * as GetStdoutWorkerUrl from '../GetStdoutWorkerUrl/GetStdoutWorkerUrl.ts'

let stdoutWorkerRpc: Rpc | undefined

export const initialize = async (): Promise<void> => {
  if (!stdoutWorkerRpc) {
    const url = GetStdoutWorkerUrl.getStdoutWorkerUrl()
    stdoutWorkerRpc = await NodeWorkerRpcParent.create({
      path: url,
      // @ts-ignore
      name: 'Stdout Worker',
      ref: false,
    })
  }
}

export const getStdoutWorker = (): Rpc => {
  if (!stdoutWorkerRpc) {
    throw new Error('Stdout worker not initialized. Call initialize() first.')
  }
  return stdoutWorkerRpc
}

export const invoke = async (method: string, ...args: any[]): Promise<any> => {
  const worker = getStdoutWorker()
  return worker.invoke(method, ...args)
}

export const cleanup = async (): Promise<void> => {
  if (stdoutWorkerRpc) {
    await stdoutWorkerRpc.dispose()
    stdoutWorkerRpc = undefined
  }
}
