import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import * as Assert from '../Assert/Assert.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.js'

class CustomStream extends Readable {
  constructor(rpc) {
    super()
    this.rpc = rpc
    this.setEncoding('utf8')
    this.handleChunk = this.handleChunk.bind(this)
    rpc.on(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
  }

  _read() {}

  handleChunk(event) {
    const { params } = event
    const { chunk } = params
    this.push(chunk)
  }

  finish() {
    this.rpc.off(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
    this.push(null)
  }
}

export const takeHeapSnapshot = async (session, outFile) => {
  Assert.object(session)
  Assert.string(outFile)
  await mkdir(dirname(outFile), { recursive: true })
  const stream = new CustomStream(session)
  const writeStream = createWriteStream(outFile)
  const pipelinePromise = pipeline(stream, writeStream)
  await DevtoolsProtocolHeapProfiler.takeHeapSnapshot(session, {
    exposeInternals: false,
    reportProgress: false,
  })
  stream.finish()
  await pipelinePromise
}
