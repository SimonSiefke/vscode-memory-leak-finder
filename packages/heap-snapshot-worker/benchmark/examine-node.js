import { writeFile } from 'fs/promises'
import { join } from 'path'
import { analyzeNodeFromFile } from '../src/parts/ExamineNode/ExamineNode.ts'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  // const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'
  const property = 'dispose'
  const resultPath = join(import.meta.dirname, '../snapshots', 'result.json')
  const depth = 1

  try {
    const id = 12124
    const r = await analyzeNodeFromFile(heapSnapshotPath, id)

    console.log(JSON.stringify(r, null, 2))

    await writeFile(resultPath, JSON.stringify(r, null, 2) + '\n')
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
