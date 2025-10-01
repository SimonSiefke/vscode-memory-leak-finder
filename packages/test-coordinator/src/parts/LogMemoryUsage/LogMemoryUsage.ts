export const logMemoryUsage = (context: string): void => {
  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  const rssMB = Math.round(memUsage.rss / 1024 / 1024)
  const externalMB = Math.round(memUsage.external / 1024 / 1024)
  
  console.log(`[TEST-COORDINATOR] ${context}: heap=${heapUsedMB}MB/${heapTotalMB}MB, rss=${rssMB}MB, external=${externalMB}MB`)
}
