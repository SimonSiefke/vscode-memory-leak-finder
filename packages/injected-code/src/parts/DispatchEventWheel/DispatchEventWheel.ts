import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const wheel = (element: Element, options: WheelEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Wheel, options)
}
