import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { compareHeapSnapshotFunctions2 } from '../src/parts/CompareHeapSnapshotsFunctions2/CompareHeapSnapshotsFunctions2.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.json')
const filePath2 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/1.json')
const resultPath = join(import.meta.dirname, '..', '.tmp', 'functions.json')

const testFunctionCount = async () => {
  console.log('Testing Function Count:')

  try {
    const count = await compareHeapSnapshotFunctions2(filePath1, filePath2, {
      minCount: 30,
      excludeOriginalPaths: ['functional.ts', 'lifecycle.ts', 'event.ts'],
    })
    console.log(count.length)
    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(count, null, 2) + '\n')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testFunctionCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
