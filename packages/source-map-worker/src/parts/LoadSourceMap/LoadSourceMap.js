import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import { loadSourceMapWorkerPath } from '../LoadSourceMapWorkerPath/LoadSourceMapWorkerPath.js'
import { VError } from '../VError/VError.js'

export const loadSourceMap = async (url) => {
  try {
    const ipc = await IpcParent.create({
      method: IpcParentType.NodeWorkerThread,
      url: loadSourceMapWorkerPath,
      stdio: 'inherit',
      execArgv: [],
    })
    HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
    const sourceMap = await JsonRpc.invoke(ipc, 'LoadSourceMap.loadSourceMap', url)
    await ipc.dispose()
    return sourceMap
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
