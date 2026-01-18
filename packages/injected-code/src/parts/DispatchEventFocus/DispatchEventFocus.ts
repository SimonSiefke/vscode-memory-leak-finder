import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const focus = (element: Element, options: FocusEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Focus, options)
}
