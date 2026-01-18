import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const contextMenu = (element: Element, options: MouseEventInit): void => {
  DispatchEvent.contextMenu(element, options)
}
