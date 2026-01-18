import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyUp = (element: Element, options: KeyboardEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyUp, options)
}
