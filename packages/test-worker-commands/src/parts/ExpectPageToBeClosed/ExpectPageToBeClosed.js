import * as TargetState from '../TargetState/TargetState.js'

export const toBeClosed = async (page) => {
  await TargetState.waitForTargetToBeClosed(page.targetId)
}
