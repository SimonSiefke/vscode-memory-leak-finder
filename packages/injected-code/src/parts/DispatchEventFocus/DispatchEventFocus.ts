import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const focus = (element: any, options: any) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.Focus, options)
}
