import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const mouseOver = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseOver, options)
}
