import { createReadStream } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { getNamedFunctionCountFromHeapSnapshot } from '../src/parts/GetNamedFunctionCountFromHeapSnapshot/GetNamedFunctionCountFromHeapSnapshot.js'
import { getNamedFunctionCountFromHeapSnapshot2 } from '../src/parts/GetNamedFunctionCountFromHeapSnapshot2/GetNamedFunctionCountFromHeapSnapshot2.js'
import { loadHeapSnapshot } from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

// Mock scriptMap for testing
const createMockScriptMap = () => {
  const scriptMap = {}
  for (let i = 0; i < 1000; i++) {
    scriptMap[i] = {
      url: `https://example.com/script${i}.js`,
      sourceMapUrl: `https://example.com/script${i}.js.map`,
    }
  }
  return scriptMap
}

const runBenchmark = async (filePath, iterations = 3) => {
  console.log(`\n=== Benchmarking Named Function Count for: ${filePath} ===`)
  console.log(`Running ${iterations} iterations for each approach\n`)

  const scriptMap = createMockScriptMap()
  const minCount = 1

  // Test original approach
  console.log('Original Approach (LoadHeapSnapshot + getNamedFunctionCountFromHeapSnapshot):')
  const originalTimes = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Load the heap snapshot into state
    await loadHeapSnapshot(filePath)

    // Count named functions
    const result = await getNamedFunctionCountFromHeapSnapshot(filePath, scriptMap, minCount)

    const endTime = performance.now()
    const duration = endTime - startTime
    originalTimes.push(duration)

    console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms (functions: ${result.length})`)
  }

  const originalAvg = originalTimes.reduce((a, b) => a + b, 0) / originalTimes.length
  const originalMin = Math.min(...originalTimes)
  const originalMax = Math.max(...originalTimes)

  console.log(`  Average: ${originalAvg.toFixed(2)}ms`)
  console.log(`  Min: ${originalMin.toFixed(2)}ms`)
  console.log(`  Max: ${originalMax.toFixed(2)}ms`)

  // Test new optimized approach
  console.log('\nNew Optimized Approach (getNamedFunctionCountFromHeapSnapshot2):')
  const optimizedTimes = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Count named functions using optimized incremental parsing
    const { locations } = await prepareHeapSnapshot(createReadStream(filePath))
    console.time('parse')
    const result = getNamedFunctionCountFromHeapSnapshot2(locations)
    console.timeEnd('parse')

    const endTime = performance.now()
    const duration = endTime - startTime
    optimizedTimes.push(duration)

    console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms (functions: ${result.length})`)
  }

  const optimizedAvg = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length
  const optimizedMin = Math.min(...optimizedTimes)
  const optimizedMax = Math.max(...optimizedTimes)

  console.log(`  Average: ${optimizedAvg.toFixed(2)}ms`)
  console.log(`  Min: ${optimizedMin.toFixed(2)}ms`)
  console.log(`  Max: ${optimizedMax.toFixed(2)}ms`)

  // Compare results
  console.log('\n=== Comparison ===')
  const speedup = originalAvg / optimizedAvg
  const improvement = ((originalAvg - optimizedAvg) / originalAvg) * 100

  console.log(`Speedup: ${speedup.toFixed(2)}x`)
  console.log(`Improvement: ${improvement.toFixed(1)}%`)

  if (speedup > 1) {
    console.log('✅ New optimized approach is faster!')
  } else {
    console.log('❌ Original approach is faster')
  }

  return {
    original: { avg: originalAvg, min: originalMin, max: originalMax },
    optimized: { avg: optimizedAvg, min: optimizedMin, max: optimizedMax },
    speedup,
    improvement,
  }
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node named-function-count-benchmark.js <heap-snapshot-file> [iterations]')
    process.exit(1)
  }

  const filePath = args[0]
  const iterations = args[1] ? parseInt(args[1], 10) : 3

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
