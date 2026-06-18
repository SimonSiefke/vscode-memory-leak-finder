import type { Dynamic } from '../Types/Types.ts'
import { Readable } from 'node:stream'
import type { Session } from '../Session/Session.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
class CustomStream extends Readable {
  rpc: Dynamic
  options: Dynamic
  constructor(rpc: Dynamic, options: Dynamic) {
    super()
    this.rpc = rpc
    this.options = options
    this.setEncoding('utf8')
    this.handleChunk = this.handleChunk.bind(this)
    rpc.on(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
  }
  _read() {}
  handleChunk(event: Dynamic) {
    const { params } = event
    const { chunk } = params
    this.push(chunk)
  }
  async start() {
    await DevtoolsProtocolHeapProfiler.takeHeapSnapshot(this.rpc, {
      captureNumericValues: this.options.captureNumericValues,
      exposeInternals: false,
      reportProgress: true,
    })
    this.rpc.off(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
    this.push(null)
  }
}
export const create = (session: Session, options: Dynamic = {}) => {
  return new CustomStream(session, options)
}
