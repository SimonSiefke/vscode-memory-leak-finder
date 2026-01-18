import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const pointerUp = (element: Element, options: PointerEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.PointerUp, options)
}
