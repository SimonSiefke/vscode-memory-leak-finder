import * as GetKeyCode from '../GetKeyCode/GetKeyCode.js'

export const getKeyboardEventOptions = (rawKey) => {
  let ctrlKey = false
  let metaKey = false
  let shiftKey = false
  let key = ''
  if (rawKey.startsWith('Control+')) {
    ctrlKey = true
    rawKey = rawKey.slice('Control+'.length)
  }
  if (rawKey.startsWith('Meta+')) {
    metaKey = true
    rawKey = rawKey.slice('Meta+'.length)
  }
  if (rawKey.startsWith('Shift+')) {
    shiftKey = true
    rawKey = rawKey.slice('Shift+'.length)
  }
  key = rawKey
  const keyCode = GetKeyCode.getKeyCode(key)
  const code = GetKeyCode.getCode(key)
  return {
    ctrlKey,
    metaKey,
    shiftKey,
    key,
    bubbles: true,
    keyCode,
    code,
  }
}
