import * as UsKeyboardLayout from '../UsKeyboardLayout/UsKeyboardLayout.ts'

export const getKeyCode = (key: string): number => {
  for (const value of Object.values(UsKeyboardLayout.USKeyboardLayout)) {
    if (value.key === key || (value as any).shiftKey === key) {
      return value.keyCode
    }
  }
  return 0
}

export const getCode = (key: string): string => {
  for (const [property, value] of Object.entries(UsKeyboardLayout.USKeyboardLayout)) {
    if (value.key === key || (value as any).shiftKey === key) {
      return property
    }
  }
  return ''
}
