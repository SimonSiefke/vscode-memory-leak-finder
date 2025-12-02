import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { compareNamedClosureCountFromHeapSnapshot } from '../src/parts/CompareNamedClosureCount/CompareNamedClosureCount.ts'
import { loadHeapSnapshot } from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.ts'

const filePath1 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, ' ../../../../../.vscode-heapsnapshots/1.json')
const scriptMapPath = join(import.meta.dirname, ' ../../../../../.vscode-script-maps/1.json')
const resultPath = join(import.meta.dirname, '../snapshots', 'result.json')

const testOptimized = async () => {
  // console.log(`\n=== Testing Optimized Named Function Count for: ${filePath} ===`)

  try {
    console.time('compare')
    const id = filePath1
    await loadHeapSnapshot(id)
    const scriptMapContent = await readFile(scriptMapPath, 'utf-8')
    const scriptMap = JSON.parse(scriptMapContent)
    const values = await compareNamedClosureCountFromHeapSnapshot(filePath1, filePath2)
    console.timeEnd('compare')
    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(values, null, 2) + '\n')

    console.log(JSON.stringify(values, null, 2))

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
