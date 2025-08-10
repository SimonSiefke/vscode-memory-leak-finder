import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const change = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Change, options)
}
