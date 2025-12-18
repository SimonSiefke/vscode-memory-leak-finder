import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const mouseUp = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseUp, options)
}
