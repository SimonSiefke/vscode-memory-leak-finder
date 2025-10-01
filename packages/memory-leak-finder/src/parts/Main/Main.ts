import * as Listen from '../Listen/Listen.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'

const handleUncaughtExceptionMonitor = (error: Error): void => {
  console.error(error)
  console.error(`[memory leak worker] uncaught exception: ${error}`)
}

export const main = async (): Promise<void> => {
  LogMemoryUsage.logMemoryUsage('worker started')
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  await Listen.listen()
}
