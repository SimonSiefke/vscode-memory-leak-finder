import * as CreateTestWorkerAndListen from '../CreateTestWorkerAndListen/CreateTestWorkerAndListen.js'

export const state = {
  /**
   * @type {any}
   */
  testWorker: undefined,
}

export const cleanup = () => {
  if (state.testWorker) {
    state.testWorker.dispose()
    state.testWorker = undefined
  }
}

export const prepare = async () => {
  // TODO race condition
  if (!state.testWorker) {
    state.testWorker = await CreateTestWorkerAndListen.createTestWorkerAndListen()
  }
  return state.testWorker
}
