import * as IsPlaywrightListener from '../IsPlaywrightListener/IsPlaywrightListener.js'
import * as Assert from '../Assert/Assert.js'

const isNormalListener = (listener) => {
  return !IsPlaywrightListener.isPlaywrightListener(listener)
}

// playwright also adds event listener, filter them out
export const removePlaywrightListeners = (result) => {
  Assert.array(result)
  return result.filter(isNormalListener)
}
