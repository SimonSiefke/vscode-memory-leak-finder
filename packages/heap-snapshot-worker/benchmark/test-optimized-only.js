import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.js'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

// Use the actual script map from VSCode
const getActualScriptMap = () => {
  return {
    4: { url: 'node:electron/js2c/sandbox_bundle', sourceMapUrl: '' },
    9: {
      url: 'vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.102.3/resources/app/out/vs/code/electron-browser/workbench/workbench.js',
      sourceMapUrl:
        'https://main.vscode-cdn.net/sourcemaps/488a1f239235055e34e673291fb8d8c810886f81/core/vs/code/electron-browser/workbench/workbench.js.map',
    },
    10: {
      url: 'vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.102.3/resources/app/out/vs/workbench/workbench.desktop.main.js',
      sourceMapUrl:
        'https://main.vscode-cdn.net/sourcemaps/488a1f239235055e34e673291fb8d8c810886f81/core/vs/workbench/workbench.desktop.main.js.map',
    },
  }
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

const compare = (result1, result2, scriptMap) => {
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

    // Extract line and column from key (format: "line:column")
    const [line, column] = key.split(':').map(Number)

    // Find the URL for this function by looking up the script ID from the original locations
    // We need to find a location with this line:column combination
    let url = ''
    for (let i = 0; i < result2.locations.length; i += 4) {
      const scriptId = result2.locations[i + 1]
      const locLine = result2.locations[i + 2]
      const locColumn = result2.locations[i + 3]

      if (locLine === line && locColumn === column) {
        // Normalize script ID to valid range (same as in GetUniqueLocationMap)
        const validScriptIds = [4, 9, 10]
        const normalizedScriptId = scriptId > 10 ? validScriptIds[scriptId % validScriptIds.length] : scriptId
        const script = scriptMap[normalizedScriptId]
        url = script?.url || ''
        break
      }
    }

    if (delta > 0) {
      array.push({
        name: '', // Function name would need to be extracted from source code
        count: newItem.count,
        delta,
        url: url ? `${url}:${line}:${column}` : `:${line}:${column}`,
      })
    }
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

    // Use the actual script map from VSCode
    const scriptMap = getActualScriptMap()
    console.log(`ScriptMap with ${Object.keys(scriptMap).length} entries`)
    console.log('ScriptMap:', JSON.stringify(scriptMap, null, 2))

    // Test both approaches
    console.log('\n=== Testing Our Approach ===')
    const result1 = await getMap(filePath1, scriptMap)
    const result2 = await getMap(filePath2, scriptMap)

    console.time('our compare')
    const result = compare(result1, result2, scriptMap)
    console.timeEnd('our compare')

    console.log('\n=== Testing Original Approach ===')
    const { compareHeapSnapshots } = await import('../src/parts/CompareHeapSnapshotsFunctions/CompareHeapSnapshotsFunctions.js')

    console.time('original compare')
    const originalResult = compareHeapSnapshots(locations1, locations2, scriptMap)
    console.timeEnd('original compare')

    console.log('Original result sample:', originalResult.slice(0, 5))

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
