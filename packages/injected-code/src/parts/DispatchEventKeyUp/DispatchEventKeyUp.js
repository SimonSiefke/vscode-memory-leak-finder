import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const keyUp = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyUp, options)
}
