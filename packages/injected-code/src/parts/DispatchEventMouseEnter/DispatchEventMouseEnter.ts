import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const mouseEnter = (element: Element, options: MouseEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseEnter, options)
}
