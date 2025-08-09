import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyUp = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyUp, options)
}
