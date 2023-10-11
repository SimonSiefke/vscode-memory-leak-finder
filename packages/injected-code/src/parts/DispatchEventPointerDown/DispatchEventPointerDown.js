import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const pointerDown = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.PointerDown, options)
}
