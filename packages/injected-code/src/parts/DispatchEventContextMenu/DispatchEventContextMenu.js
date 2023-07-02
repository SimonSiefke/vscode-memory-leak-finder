import * as ActuallyDispatchEvent from '../ActuallyDispatchEvent/ActuallyDispatchEvent.js'
import * as DomEventType from '../DomEventType/DomEventType.js'

export const contextMenu = (element, options) => {
  ActuallyDispatchEvent.actuallyDispatchEvent(element, DomEventType.ContextMenu, options)
}
