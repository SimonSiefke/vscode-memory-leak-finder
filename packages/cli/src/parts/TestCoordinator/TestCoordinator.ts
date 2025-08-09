import { NodeWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as GetTestCoordinatorUrl from '../GetTestCoordinatorUrl/GetTestCoordinatorUrl.ts'

export const listen = async (): Promise<Rpc> => {
  const url = GetTestCoordinatorUrl.getTestCoordinatorUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    // @ts-ignore
    name: 'Test Coordinator',
    ref: false,
    commandMap: CommandMapRef.commandMapRef,
  })
  return rpc
}
