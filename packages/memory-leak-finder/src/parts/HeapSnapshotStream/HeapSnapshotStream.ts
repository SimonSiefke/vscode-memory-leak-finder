import { Readable } from 'node:stream'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.js'

class CustomStream extends Readable {
  constructor(rpc, options) {
    super()
    this.rpc = rpc
    this.options = options
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
      captureNumericValues: this.options.captureNumericValues,
    })
    this.rpc.off(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
    this.push(null)
  }
}

export const create = (session, options = {}) => {
  return new CustomStream(session, options)
}
