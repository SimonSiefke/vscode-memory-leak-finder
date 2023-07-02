import * as GetKeyboardEventOptions from '../GetKeyboardEventOptions/GetKeyboardEventOptions.js'
import * as KeyBoardActions from '../KeyBoardActions/KeyBoardActions.js'

export const press = (element, { key }) => {
  const keyboardEventOptions = GetKeyboardEventOptions.getKeyboardEventOptions(key)
  KeyBoardActions.press(keyboardEventOptions, element)
}
