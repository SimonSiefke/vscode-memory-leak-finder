import { Worker } from 'node:worker_threads'
import * as FirstNodeWorkerEventType from '../FirstNodeWorkerEventType/FirstNodeWorkerEventType.js'
import * as GetFirstNodeWorkerEvent from '../GetFirstNodeWorkerEvent/GetFirstNodeWorkerEvent.js'
import { IpcError } from '../IpcError/IpcError.js'

export const create = async ({ url, stdio }) => {
  const ignoreStdio = stdio === 'inherit' ? undefined : true
  const worker = new Worker(url, {
    stdout: ignoreStdio,
    stderr: ignoreStdio,
    argv: ['--ipc-type=worker-thread'],
  })
  const { type, event } = await GetFirstNodeWorkerEvent.getFirstNodeWorkerEvent(worker)
  if (type === FirstNodeWorkerEventType.Error) {
    throw new IpcError(`Failed to start node worker: ${event}`)
  }
  if (type === FirstNodeWorkerEventType.Exit) {
    throw new IpcError(`Node worker exited unexpectedly`)
  }
  if (type === FirstNodeWorkerEventType.Message && event !== 'ready') {
    throw new IpcError(`Unexpected first message from node worker`)
  }
  return worker
}

export const wrap = (worker) => {
  return {
    worker,
    send(message) {
      this.worker.postMessage(message)
    },
    set onmessage(listener) {
      this.worker.on('message', listener)
    },
    stdout: worker.stdout,
    stderr: worker.stderr,
    dispose() {
      console.log('terminate worker')
      this.worker.terminate()
    },
    once(event, listener) {
      switch (event) {
        case 'exit':
          this.worker.once('exit', listener)
          break
        case 'error':
          this.worker.once('error', listener)
          break
        default:
          throw new Error(`unexpected listener ${event}`)
      }
    },
    on(event, listener) {
      switch (event) {
        case 'exit':
          this.worker.on('terminate', listener)
          break
        case 'error':
          this.worker.on('error', listener)
          break
        default:
          throw new Error(`unexpected listener ${event}`)
      }
    },
  }
}
