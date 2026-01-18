import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const mouseUp = (element: Element, options: MouseEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseUp, options)
}
