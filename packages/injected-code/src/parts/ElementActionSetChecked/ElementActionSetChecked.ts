import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const setChecked = (element: HTMLElement, options: { value: boolean }): void => {
  const { value } = options
  const isInput = element instanceof HTMLInputElement && element.type === 'checkbox'

  if (isInput) {
    element.checked = value
    DispatchEvent.change(element, {})
    DispatchEvent.input(element, {})
  } else {
    // For elements with aria-checked attribute (like VS Code custom checkboxes)
    if (value) {
      element.setAttribute('aria-checked', 'true')
    } else {
      element.setAttribute('aria-checked', 'false')
    }
    DispatchEvent.click(element, {})
  }
}
