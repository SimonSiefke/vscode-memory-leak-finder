import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const pointerUp = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.PointerUp, options)
}
