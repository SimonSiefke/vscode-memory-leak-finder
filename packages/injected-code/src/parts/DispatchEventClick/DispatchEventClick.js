import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const click = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Click, options)
}
