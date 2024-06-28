import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import * as Assert from '../Assert/Assert.js'
import * as HeapSnapshotStream from '../HeapSnapshotStream/HeapSnapshotStream.js'

export const takeHeapSnapshot = async (session, outFile) => {
  Assert.object(session)
  Assert.string(outFile)
  await mkdir(dirname(outFile), { recursive: true })
  const stream = HeapSnapshotStream.create(session)
  const writeStream = createWriteStream(outFile)
  const pipelinePromise = pipeline(stream, writeStream)
  await stream.start()
  await pipelinePromise
}
