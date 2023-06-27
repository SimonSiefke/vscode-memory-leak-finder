import * as UsKeyboardLayout from '../UsKeyboardLayout/UsKeyboardLayout.js'

export const getKeyCode = (key) => {
  for (const value of Object.values(UsKeyboardLayout.USKeyboardLayout)) {
    if (value.key === key || value.shiftKey === key) {
      return value.keyCode
    }
  }
  return 0
}

export const getCode = (key) => {
  for (const [property, value] of Object.entries(UsKeyboardLayout.USKeyboardLayout)) {
    if (value.key === key || value.shiftKey === key) {
      return property
    }
  }
  return ''
}
