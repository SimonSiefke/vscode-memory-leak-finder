import * as Listen from '../Listen/Listen.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'

const handleUncaughtExceptionMonitor = (error) => {
  console.error(`[test-coordinator]: Unhandled Error: ${error}`)
}

export const main = async () => {
  LogMemoryUsage.logMemoryUsage('test-coordinator started')
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor)
  
  // Set up periodic memory monitoring every 30 seconds
  const memoryMonitorInterval = setInterval(() => {
    LogMemoryUsage.logMemoryUsage('periodic check')
  }, 30000)
  
  // Clean up interval on process exit
  process.on('exit', () => {
    clearInterval(memoryMonitorInterval)
  })
  
  await Listen.listen()
}
