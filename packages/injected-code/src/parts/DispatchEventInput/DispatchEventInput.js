import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const input = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Input, options)
}
