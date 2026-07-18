import type { Dynamic } from '../Types/Types.ts'
import { Readable } from 'node:stream'
import type { Session } from '../Session/Session.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
class CustomStream extends Readable {
  rpc: Dynamic
  options: Dynamic
  stopTracking: boolean
  constructor(rpc: Dynamic, options: Dynamic, stopTracking: boolean) {
    super()
    this.rpc = rpc
    this.options = options
    this.stopTracking = stopTracking
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
    try {
      const options = {
        captureNumericValue: this.options.captureNumericValues,
        exposeInternals: false,
        reportProgress: true,
      }
      if (this.stopTracking) {
        await DevtoolsProtocolHeapProfiler.stopTrackingHeapObjects(this.rpc, options)
      } else {
        await DevtoolsProtocolHeapProfiler.takeHeapSnapshot(this.rpc, options)
      }
    } finally {
      this.rpc.off(DevtoolsEventType.HeapProfilerAddHeapSnapshotChunk, this.handleChunk)
      this.push(null)
    }
  }
}
export const create = (session: Session, options: Dynamic = {}) => {
  return new CustomStream(session, options, false)
}

export const createTrackingSnapshot = (session: Session, options: Dynamic = {}) => {
  return new CustomStream(session, options, true)
}
