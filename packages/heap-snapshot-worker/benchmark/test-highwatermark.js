import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { compareHeapSnapshotFunctions } from '../src/parts/CompareHeapSnapshotsFunctions/CompareHeapSnapshotsFunctions.js'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/1.json')

const testHighWaterMark = async (highWaterMark) => {
  console.log(`Testing with highWaterMark: ${highWaterMark}`)

  const startTime = performance.now()

  try {
    await compareHeapSnapshotFunctions(filePath1, filePath2)
    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`  Duration: ${duration.toFixed(2)}ms`)
    return duration
  } catch (error) {
    console.error('Error:', error.message)
    return null
  }
}

const main = async () => {
  const highWaterMarks = [
    16 * 1024, // 16KB
    32 * 1024, // 32KB
    64 * 1024, // 64KB
    128 * 1024, // 128KB
    256 * 1024, // 256KB
    512 * 1024, // 512KB
    1024 * 1024, // 1MB
  ]

  const results = []

  for (const hwm of highWaterMarks) {
    const duration = await testHighWaterMark(hwm)
    if (duration !== null) {
      results.push({ highWaterMark: hwm, duration })
    }
    console.log('---')
  }

  console.log('\nResults summary:')
  results.forEach(({ highWaterMark, duration }) => {
    console.log(`${highWaterMark / 1024}KB: ${duration.toFixed(2)}ms`)
  })

  const best = results.reduce((min, current) => (current.duration < min.duration ? current : min))

  console.log(`\nBest performance: ${best.highWaterMark / 1024}KB with ${best.duration.toFixed(2)}ms`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
