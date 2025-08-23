import { join } from 'node:path'
import { getRegexpObjectsFromHeapSnapshot } from '../src/parts/GetRegexpObjectsFromHeapSnapshot/GetRegexpObjectsFromHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/0.json')

const testOptimized = async () => {
  // console.log(`\n=== Testing Optimized Named Function Count for: ${filePath} ===`)

  console.log('Testing Optimized Approach (getNamedFunctionCountFromHeapSnapshot2):')

  try {
    const count = await getRegexpObjectsFromHeapSnapshot(filePath1)
    console.log({ count: count })

    // console.log(`  Duration: ${duration.toFixed(2)}ms`)
    // console.log(`  Functions found: ${result.length / 5}`)

    // if (result.length > 0) {
    //   console.log(`  Top 5 functions:`)
    //   for (let i = 0; i < Math.min(5, result.length / 5); i++) {
    //     const arrayIndex = i * 4
    //     const scriptIdIndex = result[arrayIndex]
    //     const lineIndex = result[arrayIndex + 1]
    //     const columnIndex = result[arrayIndex + 2]
    //     const count = result[arrayIndex + 3]
    //     const script = scriptMap[scriptIdIndex]
    //     const url = script?.url || 'unknown'
    //     console.log(`    ${i + 1}. ${url}:${lineIndex}:${columnIndex} (count: ${count})`)
    //   }
    // }

    // return { duration, count: result.length }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testOptimized()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
