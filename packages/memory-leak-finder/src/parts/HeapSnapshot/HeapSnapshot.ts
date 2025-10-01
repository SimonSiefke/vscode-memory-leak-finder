import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotStream from '../HeapSnapshotStream/HeapSnapshotStream.ts'

export const takeHeapSnapshot = async (session, outFile, options = {}) => {
  Assert.object(session)
  Assert.string(outFile)
  await mkdir(dirname(outFile), { recursive: true })
  console.log('created outdir')
  const stream = HeapSnapshotStream.create(session, options)
  console.log('created stream', outFile)
  const writeStream = createWriteStream(outFile)
  const pipelinePromise = pipeline(stream, writeStream)
  await stream.start()
  console.log('stream start')
  await pipelinePromise
  console.log('heapsnapshot finish')
}
