import { performance } from 'node:perf_hooks'
import { getNamedFunctionCountFromHeapSnapshot2 } from '../src/parts/GetNamedFunctionCountFromHeapSnapshot2/GetNamedFunctionCountFromHeapSnapshot2.js'

// Mock scriptMap for testing
const createMockScriptMap = () => {
  const scriptMap = {}
  for (let i = 0; i < 1000; i++) {
    scriptMap[i] = {
      url: `https://example.com/script${i}.js`,
      sourceMapUrl: `https://example.com/script${i}.js.map`
    }
  }
  return scriptMap
}

const testOptimized = async (filePath) => {
  console.log(`\n=== Testing Optimized Named Function Count for: ${filePath} ===`)

  const scriptMap = createMockScriptMap()
  const minCount = 1

  console.log('Testing Optimized Approach (getNamedFunctionCountFromHeapSnapshot2):')

  const startTime = performance.now()

  try {
    // Count named functions using optimized incremental parsing
    const result = await getNamedFunctionCountFromHeapSnapshot2(filePath, scriptMap, minCount)

    const endTime = performance.now()
    const duration = endTime - startTime

        console.log(`  Duration: ${duration.toFixed(2)}ms`)
    console.log(`  Functions found: ${result.length / 4}`)

    if (result.length > 0) {
      console.log(`  Top 5 functions:`)
      for (let i = 0; i < Math.min(5, result.length / 4); i++) {
        const arrayIndex = i * 4
        const scriptIdIndex = result[arrayIndex]
        const lineIndex = result[arrayIndex + 1]
        const columnIndex = result[arrayIndex + 2]
        const count = result[arrayIndex + 3]
        const script = scriptMap[scriptIdIndex]
        const url = script?.url || 'unknown'
        console.log(`    ${i + 1}. ${url}:${lineIndex}:${columnIndex} (count: ${count})`)
      }
    }

    return { duration, count: result.length }
  } catch (error) {
    console.error('Error:', error.message)
    return null
  }
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node test-optimized-only.js <heap-snapshot-file>')
    process.exit(1)
  }

  const filePath = args[0]

  try {
    await testOptimized(filePath)
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}