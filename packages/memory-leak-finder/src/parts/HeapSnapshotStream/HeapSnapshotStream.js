import { Readable } from 'node:stream'
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

  async start() {
    await DevtoolsProtocolHeapProfiler.takeHeapSnapshot(this.rpc, {
      exposeInternals: false,
      reportProgress: false,
    })
    this.rpc.off(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
    this.push(null)
  }
}

export const create = (session) => {
  return new CustomStream(session)
}
