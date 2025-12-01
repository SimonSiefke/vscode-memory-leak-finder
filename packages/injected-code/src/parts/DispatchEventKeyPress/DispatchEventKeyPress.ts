import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyPress = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyPress, options)
}
