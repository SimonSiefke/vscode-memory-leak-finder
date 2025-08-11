import * as Listen from '../Listen/Listen.js'

const handleUncaughtExceptionMonitor = (error) => {
  console.error(`[test-coordinator]: Unhandled Error: ${error}`)
}

export const main = async () => {
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  await Listen.listen()
}
