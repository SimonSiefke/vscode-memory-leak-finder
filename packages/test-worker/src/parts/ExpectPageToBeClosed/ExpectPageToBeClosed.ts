// import * as TargetState from '../TargetState/TargetState.ts'

export const toBeClosed = async (page) => {
  await TargetState.waitForTargetToBeClosed(page.targetId)
}
