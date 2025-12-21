import * as Listen from '../Listen/Listen.ts'

const handleUncaughtExceptionMonitor = (error: Error): void => {
  console.error(error)
  console.error(`[memory leak worker] uncaught exception: ${error}`)
}

export const main = async (): Promise<void> => {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  await Listen.listen()
}
