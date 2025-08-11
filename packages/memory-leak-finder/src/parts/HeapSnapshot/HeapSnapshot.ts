import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import * as Assert from '../Assert/Assert.js'
import * as HeapSnapshotStream from '../HeapSnapshotStream/HeapSnapshotStream.js'

export const takeHeapSnapshot = async (session, outFile, options = {}) => {
  Assert.object(session)
  Assert.string(outFile)
  await mkdir(dirname(outFile), { recursive: true })
  const stream = HeapSnapshotStream.create(session, options)
  const writeStream = createWriteStream(outFile)
  const pipelinePromise = pipeline(stream, writeStream)
  await stream.start()
  await pipelinePromise
}
