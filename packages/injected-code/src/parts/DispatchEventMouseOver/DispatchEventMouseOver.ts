import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const mouseOver = (element: Element, options: MouseEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseOver, options)
}
