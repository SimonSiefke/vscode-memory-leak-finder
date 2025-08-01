import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.js'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

// Mock scriptMap for testing
const createMockScriptMap = () => {
  const scriptMap = {}
  for (let i = 0; i < 1000; i++) {
    scriptMap[i] = {
      url: `${i}.js`,
      sourceMapUrl: `${i}.js.map`,
    }
  }
  return scriptMap
}

const filePath1 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/1.json')
const outPath = join(import.meta.dirname, '../benchmark-results/named-function-count.json')

const getMap = async (filePath, scriptMap) => {
  // Count named functions using optimized incremental parsing
  const { locations } = await prepareHeapSnapshot(createReadStream(filePath1))
  console.log({ locations })
  const map = getUniqueLocationMap(locations, scriptMap)
  return {
    locations,
    map,
  }
}

const compare = (result1, result2) => {
  const map1 = result1.map
  const map2 = result2.map
  const array = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key]
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    // if (delta > 0) {
    array.push({
      key,
      ...newItem,
      delta,
    })
    // }
  }
  array.sort((a, b) => b.count - a.count)
  return array
}

const testOptimized = async () => {
  // console.log(`\n=== Testing Optimized Named Function Count for: ${filePath} ===`)

  const scriptMap = createMockScriptMap()
  const minCount = 1

  console.log('Testing Optimized Approach (getNamedFunctionCountFromHeapSnapshot2):')

  const startTime = performance.now()

  try {
    // Count named functions using optimized incremental parsing
    const { locations } = await prepareHeapSnapshot(createReadStream(filePath1))
    console.log({ locations })
    const result1 = await getMap(filePath1, scriptMap)
    const result2 = await getMap(filePath2, scriptMap)

    console.time('compare')
    const result = compare(result1, result2)
    console.timeEnd('compare')

    await writeFile(outPath, JSON.stringify(result, null, 2) + '\n')

    console.log({ result })
    const endTime = performance.now()
    const duration = endTime - startTime

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
    await testOptimized()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
