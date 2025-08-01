import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.js'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

// Extract scriptMap from heap snapshot metadata
const extractScriptMap = (metaData) => {
  const scriptMap = {}

  // The script information should be in the metadata
  if (metaData && metaData.data && metaData.data.scripts) {
    for (const script of metaData.data.scripts) {
      scriptMap[script.scriptId] = {
        url: script.url || '',
        sourceMapUrl: script.sourceMapURL || '',
      }
    }
  }

  return scriptMap
}

const filePath1 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/1.json')
const outPath = join(import.meta.dirname, '../benchmark-results/named-function-count.json')

const getMap = async (filePath, scriptMap) => {
  // Count named functions using optimized incremental parsing
  const { locations } = await prepareHeapSnapshot(createReadStream(filePath))
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

  // Debug: show some keys from both maps
  const keys1 = Object.keys(map1).slice(0, 5)
  const keys2 = Object.keys(map2).slice(0, 5)
  console.log('Sample keys from map1:', keys1)
  console.log('Sample keys from map2:', keys2)
  console.log('Map1 size:', Object.keys(map1).length)
  console.log('Map2 size:', Object.keys(map2).length)

  const array = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key]
    const newItem = map2[key]
    const oldCount = oldItem?.count || 0
    const delta = newItem.count - oldCount
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

  const minCount = 1

  console.log('Testing Optimized Approach (getNamedFunctionCountFromHeapSnapshot2):')

  const startTime = performance.now()

  try {
    // Check if files exist
    const { access } = await import('node:fs/promises')
    try {
      await access(filePath1)
      await access(filePath2)
    } catch (error) {
      console.error(`Heap snapshot files not found: ${filePath1} or ${filePath2}`)
      console.error('Please ensure the heap snapshot files exist at the specified paths')
      return null
    }

        // Load both snapshots first to extract script map from metadata
    const { locations: locations1, metaData: metaData1 } = await prepareHeapSnapshot(createReadStream(filePath1))
    const { locations: locations2, metaData: metaData2 } = await prepareHeapSnapshot(createReadStream(filePath2))

    // Extract script map from metadata (use first snapshot's metadata as they should be the same)
    const scriptMap = extractScriptMap(metaData1)
    console.log(`ScriptMap extracted with ${Object.keys(scriptMap).length} entries`)
    console.log('ScriptMap:', JSON.stringify(scriptMap, null, 2))

    // Count named functions using optimized incremental parsing
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
