import * as CreateTestCoordinatorAndListen from '../CreateTestCoordinatorAndListen/CreateTestCoordinatorAndListen.js'

export const state = {
  /**
   * @type {import('@lvce-editor/rpc').Rpc|undefined}
   */
  testCoordinator: undefined,
}

const cleanup = () => {
  if (state.testCoordinator) {
    state.testCoordinator.dispose()
    state.testCoordinator = undefined
  }
}

export const prepare = async () => {
  // TODO race condition
  if (!state.testCoordinator) {
    state.testCoordinator = await CreateTestCoordinatorAndListen.createTestCoordinatorAndListen()
  }
  return state.testCoordinator
}
