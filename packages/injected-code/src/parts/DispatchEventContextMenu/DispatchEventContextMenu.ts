import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'

export const contextMenu = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.ContextMenu, options)
}
