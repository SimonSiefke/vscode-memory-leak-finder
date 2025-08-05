import * as Callback from '../Callback/Callback.ts'
import * as Command from '../Command/Command.ts'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandState from '../CommandState/CommandState.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcChild from '../IpcChild/IpcChild.ts'
import * as IpcChildType from '../IpcChildType/IpcChildType.ts'

const handleUncaughtExceptionMonitor = (error: Error): void => {
  console.error(error)
  console.error(`[memory leak worker] uncaught exception: ${error}`)
}

export const main = async (): Promise<void> => {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  CommandState.registerCommands(CommandMap.commandMap)
  const ipc = await IpcChild.listen({ method: IpcChildType.Auto() })
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
}
