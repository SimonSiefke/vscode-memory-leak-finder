import { NodeForkedProcessRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'

function handleUncaughtExceptionMonitor(error: Error): void {
  console.error(error)
  console.error(`[chromium memory dump worker] uncaught exception: ${error}`)
}

export async function main(): Promise<void> {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  await NodeForkedProcessRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}
