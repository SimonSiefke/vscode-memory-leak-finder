import { join } from 'node:path'
import * as Callback from '../Callback/Callback.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcParent from '../IpcParent/IpcParent.ts'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as Root from '../Root/Root.ts'

const execute = () => {}

const sourceMapWorkerPath = join(Root.root, 'packages', 'source-map-worker', 'src', 'sourceMapWorkerMain.ts')

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames) => {
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    stdio: 'inherit',
    url: sourceMapWorkerPath,
  })
  HandleIpc.handleIpc(ipc, execute, Callback.resolve)
  const response = await JsonRpc.invoke(ipc, 'SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  return response
}
