export const waitForEvent = (worker) => {
  const { promise, resolve } = Promise.withResolvers()
  const cleanup = (result) => {
    worker.off('message', messageHandler)
    worker.off('exit', exitHandler)
    resolve(result)
  }

  const messageHandler = (message) => {
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

  const exitHandler = (code) => {
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
