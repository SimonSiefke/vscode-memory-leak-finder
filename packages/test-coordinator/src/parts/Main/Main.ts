import * as Listen from '../Listen/Listen.ts'

const handleUncaughtExceptionMonitor = (error: Error): void => {
  console.error(`[test-coordinator]: Unhandled Error: ${error}`)
}

export const main = async () => {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  await Listen.listen()
}
