import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const input = (element: Element, options: InputEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Input, options)
}
