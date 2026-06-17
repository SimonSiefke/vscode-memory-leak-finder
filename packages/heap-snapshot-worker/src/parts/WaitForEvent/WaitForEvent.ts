<<<<<<< HEAD
export const waitForEvent = (worker: any) => {
  const { promise, resolve } = Promise.withResolvers()
  const cleanup = (result: any) => {
=======
import type { Worker } from 'node:worker_threads'

interface WorkerMessage {
  readonly error?: string
  readonly result?: unknown
}

interface WaitForEventResult {
  readonly error?: Error | undefined
  readonly result?: unknown
}

export const waitForEvent = (worker: Worker): Promise<WaitForEventResult> => {
  const { promise, resolve } = Promise.withResolvers<WaitForEventResult>()
  const cleanup = (result: WaitForEventResult): void => {
>>>>>>> origin/main
    worker.off('message', messageHandler)
    worker.off('exit', exitHandler)
    resolve(result)
  }

<<<<<<< HEAD
  const messageHandler = (message: any) => {
=======
  const messageHandler = (message: WorkerMessage): void => {
>>>>>>> origin/main
    if (message.error) {
      cleanup({
        error: new Error(message.error),
        result: undefined,
      })
      return
    }
    cleanup({
      error: undefined,
      result: message.result,
    })
  }

<<<<<<< HEAD
  const exitHandler = (code: any) => {
=======
  const exitHandler = (code: number): void => {
>>>>>>> origin/main
    if (code === 0) {
      cleanup({
        error: new Error('Worker exited unexpectedly'),
        result: undefined,
      })
      return
    }
    cleanup({
      error: new Error(`Worker stopped with exit code ${code}`),
      result: undefined,
    })
  }
  return promise
}
