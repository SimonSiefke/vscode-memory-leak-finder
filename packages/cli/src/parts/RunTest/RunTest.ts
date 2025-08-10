import type { Rpc } from '@lvce-editor/rpc'
import * as CreateTestCoordinatorAndListen from '../CreateTestCoordinatorAndListen/CreateTestCoordinatorAndListen.ts'

interface State {
  testCoordinator: Rpc | undefined
}

export const state: State = {
  testCoordinator: undefined,
}

export const cleanup = (): void => {
  if (state.testCoordinator) {
    state.testCoordinator.dispose()
    state.testCoordinator = undefined
  }
}

export const prepare = async (): Promise<Rpc> => {
  // TODO race condition
  if (!state.testCoordinator) {
    state.testCoordinator = await CreateTestCoordinatorAndListen.createTestCoordinatorAndListen()
  }
  return state.testCoordinator
}
