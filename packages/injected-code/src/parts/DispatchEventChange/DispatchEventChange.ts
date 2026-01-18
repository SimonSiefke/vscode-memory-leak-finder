import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const change = (element: Element, options: EventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Change, options)
}
