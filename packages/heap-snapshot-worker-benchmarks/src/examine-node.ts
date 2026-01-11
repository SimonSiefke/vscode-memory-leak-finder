import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

async function testGetObjectsWithProperties(): Promise<void> {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  // const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'
  // const property = 'dispose'
  const resultPath = join(import.meta.dirname, '../../heap-snapshot-worker/snapshots', 'result.json')
  // const depth = 1

  try {
    const { analyzeNodeFromFile } = await importHeapSnapshotWorker('parts/ExamineNode/ExamineNode.ts')
    const id = 302_297
    const r = await analyzeNodeFromFile(heapSnapshotPath, id)

    console.log(JSON.stringify(r, null, 2))

    await writeFile(resultPath, JSON.stringify(r, null, 2) + '\n')
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
