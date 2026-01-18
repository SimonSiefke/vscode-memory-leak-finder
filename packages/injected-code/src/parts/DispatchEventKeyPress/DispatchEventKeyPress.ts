import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyPress = (element: Element, options: KeyboardEventInit) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyPress, options)
}
