import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import * as Assert from '../Assert/Assert.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const createIterator = (rpc) => {
  const stream = new Readable()
  stream._read = () => {}
  const handleChunk = (event) => {
    const { params } = event
    const { chunk } = params
    stream.push(chunk)
  }
  const handleDone = () => {
    rpc.off(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, handleChunk)
    rpc.off(DevtoolsEventType.HeapProfilerReportHeapSnapshotProgress, handleProgress)
    stream.push(null)
  }
  const handleProgress = (event) => {
    const { params } = event
    const { finished } = params
    if (!finished) {
      return
    }
    handleDone()
  }
  rpc.on(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, handleChunk)
  rpc.on(DevtoolsEventType.HeapProfilerReportHeapSnapshotProgress, handleProgress)
  return stream
}

export const takeHeapSnapshot = async (session, outFile) => {
  Assert.object(session)
  Assert.string(outFile)
  await mkdir(dirname(outFile), { recursive: true })
  const stream = createIterator(session)
  const writeStream = createWriteStream(outFile)
  const pipelinePromise = pipeline(stream, writeStream)
  await DevtoolsProtocolHeapProfiler.takeHeapSnapshot(session, {
    exposeInternals: false,
    reportProgress: true,
  })
  await pipelinePromise
}
