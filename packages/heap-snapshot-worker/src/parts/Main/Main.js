import { NodeForkedProcessRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.js'

const handleUncaughtExceptionMonitor = (error) => {
  console.error(error)
  console.error(`[heap snapshot worker] uncaught exception: ${error}`)
}

export const main = async () => {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  await NodeForkedProcessRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}
