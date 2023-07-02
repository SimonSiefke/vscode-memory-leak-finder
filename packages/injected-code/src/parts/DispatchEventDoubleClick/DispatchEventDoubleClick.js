import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const dblclick = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.DoubleClick, options)
}
