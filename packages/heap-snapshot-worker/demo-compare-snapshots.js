import { createReadStream } from 'node:fs'
import { compareHeapSnapshots } from './src/parts/CompareHeapSnapshots/CompareHeapSnapshots.js'
import { prepareHeapSnapshot } from './src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

// Create scriptMap based on actual scriptIdIndex values in the heap snapshot
const createScriptMap = (locations) => {
  const scriptMap = {}
  const scriptIdIndices = new Set()

  // Collect all scriptIdIndex values
  for (let i = 0; i < locations.length; i += 4) {
    scriptIdIndices.add(locations[i + 1])
  }

  // Create scriptMap entries for all scriptIdIndex values
  for (const scriptIdIndex of scriptIdIndices) {
    scriptMap[scriptIdIndex] = {
      url: `https://example.com/script${scriptIdIndex}.js`,
      sourceMapUrl: `https://example.com/script${scriptIdIndex}.js.map`,
    }
  }

  return scriptMap
}

const demoCompareSnapshots = async (filePath1, filePath2) => {
  console.log(`\n=== Comparing Heap Snapshots ===`)
  console.log(`Baseline: ${filePath1}`)
  console.log(`Current:  ${filePath2}\n`)

  try {
    // Load both heap snapshots
    console.log('Loading heap snapshots...')
    const { locations: locations1 } = await prepareHeapSnapshot(createReadStream(filePath1))
    const { locations: locations2 } = await prepareHeapSnapshot(createReadStream(filePath2))

    console.log(`Baseline snapshot: ${locations1.length / 4} locations`)
    console.log(`Current snapshot:  ${locations2.length / 4} locations`)

    // Create scriptMap from both snapshots
    const allLocations = new Uint32Array(locations1.length + locations2.length)
    allLocations.set(locations1, 0)
    allLocations.set(locations2, locations1.length)
    const scriptMap = createScriptMap(allLocations)

    console.log(`ScriptMap created with ${Object.keys(scriptMap).length} entries\n`)

    // Compare snapshots
    console.log('Analyzing for leaked functions...')
    const startTime = performance.now()
    const leakedFunctions = compareHeapSnapshots(locations1, locations2, scriptMap)
    const endTime = performance.now()

    console.log(`Analysis completed in ${(endTime - startTime).toFixed(2)}ms\n`)

    // Display results
    if (leakedFunctions.length === 0) {
      console.log('✅ No leaked functions detected!')
    } else {
      console.log(`🚨 Found ${leakedFunctions.length} potentially leaked functions:\n`)

      // Display top 20 leaks
      const topLeaks = leakedFunctions.slice(0, 20)
      console.log('Top 20 leaked functions (sorted by delta):')
      console.log('┌─────────┬─────────┬─────────┬─────────┬─────────┐')
      console.log('│ Count   │ Delta   │ ScriptId│ Line    │ Column  │')
      console.log('├─────────┼─────────┼─────────┼─────────┼─────────┤')

      for (const leak of topLeaks) {
        console.log(
          `│ ${leak.count.toString().padStart(7)} │ ${leak.delta.toString().padStart(7)} │ ${leak.scriptId.toString().padStart(7)} │ ${leak.line.toString().padStart(7)} │ ${leak.column.toString().padStart(7)} │`,
        )
      }
      console.log('└─────────┴─────────┴─────────┴─────────┴─────────┘')

      if (leakedFunctions.length > 20) {
        console.log(`\n... and ${leakedFunctions.length - 20} more leaked functions`)
      }

      // Summary statistics
      const totalDelta = leakedFunctions.reduce((sum, leak) => sum + leak.delta, 0)
      const totalCount = leakedFunctions.reduce((sum, leak) => sum + leak.count, 0)
      console.log(`\n📊 Summary:`)
      console.log(`   Total leaked instances: ${totalDelta}`)
      console.log(`   Total current instances: ${totalCount}`)
      console.log(`   Average delta per function: ${(totalDelta / leakedFunctions.length).toFixed(1)}`)
    }
  } catch (error) {
    console.error('❌ Error comparing heap snapshots:', error.message)
    process.exit(1)
  }
}

const main = async () => {
  // For demo purposes, we'll use the same file twice
  // In a real scenario, you'd use two different heap snapshots
  const filePath1 = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'
  const filePath2 = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'

  await demoCompareSnapshots(filePath1, filePath2)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
