import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const change = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Change, options)
}
