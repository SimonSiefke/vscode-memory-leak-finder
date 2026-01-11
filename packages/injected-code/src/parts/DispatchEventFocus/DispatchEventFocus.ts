import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const focus = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Focus, options)
}
