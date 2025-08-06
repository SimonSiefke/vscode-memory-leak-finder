import * as CliProcess from '../CliProcess/CliProcess.js'
import * as CommandMap from '../CommandMap/CommandMap.js'
import * as CommandState from '../CommandState/CommandState.js'
import * as IpcChild from '../IpcChild/IpcChild.js'
import * as IpcChildType from '../IpcChildType/IpcChildType.js'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'

export const main = async () => {
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  CommandState.registerCommands(CommandMap.commandMap)
  const rpc = await IpcChild.listen({ method: IpcChildType.Auto(), commandMap: CommandMapRef.commandMapRef })
  CliProcess.set(rpc)
}
