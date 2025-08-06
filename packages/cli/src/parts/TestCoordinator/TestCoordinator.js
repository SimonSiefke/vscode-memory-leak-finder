import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'
import * as GetTestCoordinatorUrl from '../GetTestCoordinatorUrl/GetTestCoordinatorUrl.js'

export const listen = async () => {
  const url = GetTestCoordinatorUrl.getTestCoordinatorUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    // @ts-ignore
    name: 'Test Coordinator',
    ref: false,
    argv: ['--ipc-type=worker-thread'],
    commandMap: CommandMapRef.commandMapRef,
  })
  return rpc
}
