import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const pointerDown = (element: Element, options: PointerEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.PointerDown, options)
}
