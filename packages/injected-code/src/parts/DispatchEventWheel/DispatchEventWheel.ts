import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const wheel = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Wheel, options)
}
