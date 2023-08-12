import * as IsPlaywrightListener from '../IsPlaywrightListener/IsPlaywrightListener.js'

const isNormalListener = (listener) => {
  return !IsPlaywrightListener.isPlaywrightListener(listener)
}

// playwright also adds event listener, filter them out
export const removePlaywrightListeners = (result) => {
  return result.filter(isNormalListener)
}
