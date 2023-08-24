import * as CommandMap from '../CommandMap/CommandMap.js'
import * as CommandState from '../CommandState/CommandState.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcChild from '../IpcChild/IpcChild.js'
import * as IpcChildType from '../IpcChildType/IpcChildType.js'
import * as ParentProcess from '../ParentProcess/ParentProcess.js'

export const listen = async () => {
  const commandMap = await CommandMap.load()
  CommandState.registerCommands(commandMap)
  const ipc = await IpcChild.listen({ method: IpcChildType.Auto() })
  HandleIpc.handleIpc(ipc)
  ParentProcess.setIpc(ipc)
}
