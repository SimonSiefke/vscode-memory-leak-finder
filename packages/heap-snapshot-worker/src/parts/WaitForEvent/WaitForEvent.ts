import type { Worker } from 'node:worker_threads'

interface WorkerMessage {
  readonly error?: string
  readonly result?: unknown
}

interface WaitForEventResult {
  readonly error?: Error
  readonly result?: unknown
}

export const waitForEvent = (worker: Worker): Promise<WaitForEventResult> => {
  const { promise, resolve } = Promise.withResolvers<WaitForEventResult>()
  const cleanup = (result: WaitForEventResult): void => {
    worker.off('message', messageHandler)
    worker.off('exit', exitHandler)
    resolve(result)
  }

  const messageHandler = (message: WorkerMessage): void => {
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

  const exitHandler = (code: number): void => {
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
