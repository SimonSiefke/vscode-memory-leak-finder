import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const keyPress = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyPress, options)
}
