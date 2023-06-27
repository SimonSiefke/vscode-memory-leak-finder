import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as TestWorker from '../TestWorker/TestWorker.js'

export const state = {
  /**
   * @type {any}
   */
  testWorker: undefined,
}

const cleanup = () => {
  if (state.testWorker) {
    state.testWorker.dispose()
    state.testWorker = undefined
  }
}

export const prepare = async () => {
  cleanup()
  const worker = await TestWorker.listen(IpcParentType.NodeWorkerThread)
  state.testWorker = worker
  return worker
}
