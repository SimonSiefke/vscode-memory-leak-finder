import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const click = (element: any, options: any) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Click, options)
}
