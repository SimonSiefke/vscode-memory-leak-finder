import { Worker } from 'node:worker_threads'
import * as FirstNodeWorkerEventType from '../FirstNodeWorkerEventType/FirstNodeWorkerEventType.ts'
import * as GetFirstNodeWorkerEvent from '../GetFirstNodeWorkerEvent/GetFirstNodeWorkerEvent.ts'
import { IpcError } from '../IpcError/IpcError.ts'

export const create = async ({ execArgv = [], stdio, url }) => {
  const ignoreStdio = stdio === 'inherit' ? undefined : true
  const worker = new Worker(url, {
    argv: ['--ipc-type=worker-thread'],
    execArgv,
    stderr: ignoreStdio,
    stdout: ignoreStdio,
  })
  const { event, type } = await GetFirstNodeWorkerEvent.getFirstNodeWorkerEvent(worker)
  if (type === FirstNodeWorkerEventType.Error) {
    throw new IpcError(`Failed to start node worker: ${event.message}`)
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
    dispose() {
      return this.worker.terminate()
    },
    on(event, listener) {
      switch (event) {
        case 'error':
          this.worker.on('error', listener)
          break
        case 'exit':
          this.worker.on('terminate', listener)
          break
        case 'message':
          this.worker.on('message', listener)
          break
        default:
          throw new Error(`unexpected listener ${event}`)
      }
    },
    once(event, listener) {
      switch (event) {
        case 'error':
          this.worker.once('error', listener)
          break
        case 'exit':
          this.worker.once('exit', listener)
          break
        default:
          throw new Error(`unexpected listener ${event}`)
      }
    },
    set onmessage(listener) {
      this.worker.on('message', listener)
    },
    send(message) {
      this.worker.postMessage(message)
    },
    stderr: worker.stderr,
    stdout: worker.stdout,
    worker,
  }
}
