import * as GetKeyboardEventOptions from '../GetKeyboardEventOptions/GetKeyboardEventOptions.ts'
import * as KeyBoardActions from '../KeyBoardActions/KeyBoardActions.ts'

export const press = (element: Element, { key }: { key: string }): void => {
  const keyboardEventOptions = GetKeyboardEventOptions.getKeyboardEventOptions(key)
  KeyBoardActions.press(keyboardEventOptions, element)
}
