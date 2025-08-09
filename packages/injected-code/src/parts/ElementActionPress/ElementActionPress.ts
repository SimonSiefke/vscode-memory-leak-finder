import * as GetKeyboardEventOptions from '../GetKeyboardEventOptions/GetKeyboardEventOptions.ts'
import * as KeyBoardActions from '../KeyBoardActions/KeyBoardActions.ts'

export const press = (element, { key }) => {
  const keyboardEventOptions = GetKeyboardEventOptions.getKeyboardEventOptions(key)
  KeyBoardActions.press(keyboardEventOptions, element)
}
