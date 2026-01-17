import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const keyUp = (element: any, options: any) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.KeyUp, options)
}
