import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyDown = (element: Element, options: KeyboardEventInit) => {
  return ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyDown, options)
}
