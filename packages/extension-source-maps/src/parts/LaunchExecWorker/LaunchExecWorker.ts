import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getExecWorkerUrl } from '../GetExecWorkerUrl/GetExecWorkerUrl.ts'

export const launchExecWorker = async () => {
  const url = getExecWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return {
    invoke: rpc.invoke.bind(rpc),
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
