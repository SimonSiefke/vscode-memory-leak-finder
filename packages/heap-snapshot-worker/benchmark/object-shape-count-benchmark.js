import { performance } from 'node:perf_hooks'
import { getObjectShapeCountFromHeapSnapshot } from '../src/parts/GetObjectShapeCountFromHeapSnapshot/GetObjectShapeCountFromHeapSnapshot.js'
import { getObjectShapeCountFromHeapSnapshot2 } from '../src/parts/GetObjectShapeCountFromHeapSnapshot2/GetObjectShapeCountFromHeapSnapshot2.js'
import { getObjectShapeCountFromHeapSnapshot3 } from '../src/parts/GetObjectShapeCountFromHeapSnapshot3/GetObjectShapeCountFromHeapSnapshot3.js'
import { loadHeapSnapshot } from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

const runBenchmark = async (filePath, iterations = 5) => {
  console.log(`\n=== Benchmarking Object Shape Count for: ${filePath} ===`)
  console.log(`Running ${iterations} iterations for each approach\n`)

  // Test original approach
  console.log('Original Approach (LoadHeapSnapshot + getObjectShapeCountFromHeapSnapshot):')
  const originalTimes = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Load the heap snapshot into state
    await loadHeapSnapshot(filePath)

    // Count object shapes
    const count = getObjectShapeCountFromHeapSnapshot(filePath)

    const endTime = performance.now()
    const duration = endTime - startTime
    originalTimes.push(duration)

    console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms (count: ${count})`)
  }

  const originalAvg = originalTimes.reduce((a, b) => a + b, 0) / originalTimes.length
  const originalMin = Math.min(...originalTimes)
  const originalMax = Math.max(...originalTimes)

  console.log(`  Average: ${originalAvg.toFixed(2)}ms`)
  console.log(`  Min: ${originalMin.toFixed(2)}ms`)
  console.log(`  Max: ${originalMax.toFixed(2)}ms`)

  // Test new incremental approach
  console.log('\nNew Incremental Approach (getObjectShapeCountFromHeapSnapshot2):')
  const incrementalTimes = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Count object shapes using incremental parsing
    const count = await getObjectShapeCountFromHeapSnapshot2(filePath)

    const endTime = performance.now()
    const duration = endTime - startTime
    incrementalTimes.push(duration)

    console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms (count: ${count})`)
  }

  const incrementalAvg = incrementalTimes.reduce((a, b) => a + b, 0) / incrementalTimes.length
  const incrementalMin = Math.min(...incrementalTimes)
  const incrementalMax = Math.max(...incrementalTimes)

  console.log(`  Average: ${incrementalAvg.toFixed(2)}ms`)
  console.log(`  Min: ${incrementalMin.toFixed(2)}ms`)
  console.log(`  Max: ${incrementalMax.toFixed(2)}ms`)

  // Test new parallelized approach
  console.log('\nNew Parallelized Approach (getObjectShapeCountFromHeapSnapshot3):')
  const parallelizedTimes = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Count object shapes using parallelized incremental parsing
    const count = await getObjectShapeCountFromHeapSnapshot3(filePath, 4)

    const endTime = performance.now()
    const duration = endTime - startTime
    parallelizedTimes.push(duration)

    console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms (count: ${count})`)
  }

  const parallelizedAvg = parallelizedTimes.reduce((a, b) => a + b, 0) / parallelizedTimes.length
  const parallelizedMin = Math.min(...parallelizedTimes)
  const parallelizedMax = Math.max(...parallelizedTimes)

  console.log(`  Average: ${parallelizedAvg.toFixed(2)}ms`)
  console.log(`  Min: ${parallelizedMin.toFixed(2)}ms`)
  console.log(`  Max: ${parallelizedMax.toFixed(2)}ms`)

  // Compare results
  console.log('\n=== Comparison ===')
  const speedupIncremental = originalAvg / incrementalAvg
  const improvementIncremental = ((originalAvg - incrementalAvg) / originalAvg) * 100
  const speedupParallelized = originalAvg / parallelizedAvg
  const improvementParallelized = ((originalAvg - parallelizedAvg) / originalAvg) * 100
  const speedupParallelizedVsIncremental = incrementalAvg / parallelizedAvg

  console.log(`Incremental vs Original:`)
  console.log(`  Speedup: ${speedupIncremental.toFixed(2)}x`)
  console.log(`  Improvement: ${improvementIncremental.toFixed(1)}%`)

  console.log(`\nParallelized vs Original:`)
  console.log(`  Speedup: ${speedupParallelized.toFixed(2)}x`)
  console.log(`  Improvement: ${improvementParallelized.toFixed(1)}%`)

  console.log(`\nParallelized vs Incremental:`)
  console.log(`  Speedup: ${speedupParallelizedVsIncremental.toFixed(2)}x`)
  console.log(`  Improvement: ${(((incrementalAvg - parallelizedAvg) / incrementalAvg) * 100).toFixed(1)}%`)

  if (speedupParallelized > speedupIncremental) {
    console.log('✅ Parallelized approach is the fastest!')
  } else if (speedupIncremental > 1) {
    console.log('✅ Incremental approach is faster than original!')
  } else {
    console.log('❌ Original approach is fastest')
  }

  return {
    original: { avg: originalAvg, min: originalMin, max: originalMax },
    incremental: { avg: incrementalAvg, min: incrementalMin, max: incrementalMax },
    parallelized: { avg: parallelizedAvg, min: parallelizedMin, max: parallelizedMax },
    speedupIncremental,
    improvementIncremental,
    speedupParallelized,
    improvementParallelized,
  }
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node object-shape-count-benchmark.js <heap-snapshot-file> [iterations]')
    process.exit(1)
  }

  const filePath = args[0]
  const iterations = args[1] ? parseInt(args[1], 10) : 5

  try {
    await runBenchmark(filePath, iterations)
  } catch (error) {
    console.error('Benchmark failed:', error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
