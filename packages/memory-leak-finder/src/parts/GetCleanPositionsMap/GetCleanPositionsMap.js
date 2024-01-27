import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.js'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'
import * as SourceMap from '../SourceMap/SourceMap.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as Root from '../Root/Root.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Callback from '../Callback/Callback.js'
import { join } from 'path'

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
