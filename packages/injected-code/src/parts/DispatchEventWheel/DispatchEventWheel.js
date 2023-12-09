import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const wheel = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Wheel, options)
}
