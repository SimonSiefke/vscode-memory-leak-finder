import { test, expect } from '@jest/globals'
import { parseFromFile } from '../src/parts/ParseFromFile/ParseFromFile.ts'
import { createHeapSnapshotWriteStream } from '../src/parts/HeapSnapshotWriteStream/HeapSnapshotWriteStream.ts'
import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

test('parseFromFile - parses actual heap snapshot with strings', async () => {
  const result = await parseFromFile('/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json', {
    parseStrings: true,
    validate: false
  } as any)

  expect(result.metaData).toBeDefined()
  expect(result.nodes).toBeDefined()
  expect(result.edges).toBeDefined()
  expect(result.locations).toBeDefined()
  expect(result.strings).toBeDefined()
  expect(Array.isArray(result.strings)).toBe(true)
  console.log('Strings length:', result.strings.length)
  console.log('MetaData:', JSON.stringify(result.metaData, null, 2))
}, 30000) // 30 second timeout for large file

test('parseFromFile - debug parsing state', async () => {
  const readStream = createReadStream('/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json')
  const writeStream = createHeapSnapshotWriteStream({
    parseStrings: true,
    validate: false
  } as any)

  await pipeline(readStream, writeStream)
  const result = writeStream.getResult()

  console.log('Final state:', writeStream.state)
  console.log('Strings length:', result.strings.length)
  console.log('MetaData:', JSON.stringify(result.metaData, null, 2))

  expect(result.metaData).toBeDefined()
}, 30000) // 30 second timeout for large file
