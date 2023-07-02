import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const mouseEnter = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseEnter, options)
}
