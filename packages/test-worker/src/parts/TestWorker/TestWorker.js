import * as CommandMap from '../CommandMap/CommandMap.js'
import * as CommandState from '../CommandState/CommandState.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcChild from '../IpcChild/IpcChild.js'
import * as IpcChildType from '../IpcChildType/IpcChildType.js'
import * as ParentProcess from '../ParentProcess/ParentProcess.js'

export const listen = async () => {
  console.time('load commands')
  const commandMap = await CommandMap.load()
  console.timeEnd('load commands')
  CommandState.registerCommands(commandMap)
  const ipc = await IpcChild.listen({ method: IpcChildType.Auto() })
  console.log('ready')
  HandleIpc.handleIpc(ipc)
  ParentProcess.setIpc(ipc)
}
