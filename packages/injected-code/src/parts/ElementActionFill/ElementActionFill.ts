import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const fill = (element: HTMLInputElement | HTMLTextAreaElement, options: { text: string }): void => {
  element.value = options.text
  DispatchEvent.input(element, {})
  DispatchEvent.change(element, {})
}
