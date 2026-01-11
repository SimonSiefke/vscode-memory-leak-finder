import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const pointerUp = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.PointerUp, options)
}
