import { join } from 'node:path'
import * as Callback from '../Callback/Callback.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Root from '../Root/Root.js'

const execute = () => {}

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames) => {
  const sourceMapWorkerPath = join(Root.root, 'packages', 'source-map-worker', 'src', 'sourceMapWorkerMain.js')
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    stdio: 'inherit',
    url: sourceMapWorkerPath,
  })
  HandleIpc.handleIpc(ipc, execute, Callback.resolve)
  const response = await JsonRpc.invoke(ipc, 'SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  return response
}
