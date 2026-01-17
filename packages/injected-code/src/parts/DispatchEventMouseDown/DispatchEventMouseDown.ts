import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const mouseDown = (element: any, options: any) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.MouseDown, options)
}
