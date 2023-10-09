import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as CommandMap from '../CommandMap/CommandMap.js'
import * as CommandState from '../CommandState/CommandState.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcChild from '../IpcChild/IpcChild.js'
import * as IpcChildType from '../IpcChildType/IpcChildType.js'

const handleUncaughtExceptionMonitor = (error) => {
  console.error(`[memory leak worker] uncaught exception: ${error}`)
}

export const main = async () => {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  CommandState.registerCommands(CommandMap.commandMap)
  const ipc = await IpcChild.listen({ method: IpcChildType.Auto() })
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
}
