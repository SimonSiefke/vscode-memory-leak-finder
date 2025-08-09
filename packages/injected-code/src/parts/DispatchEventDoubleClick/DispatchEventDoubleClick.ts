import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const dblclick = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.DoubleClick, options)
}
