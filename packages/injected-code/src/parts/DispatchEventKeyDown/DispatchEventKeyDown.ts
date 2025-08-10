import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyDown = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyDown, options)
}
