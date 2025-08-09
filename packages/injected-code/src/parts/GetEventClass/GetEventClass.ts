import * as DomEventType from '../DomEventType/DomEventType.ts'

export const getEventClass = (eventType: string): any => {
  switch (eventType) {
    case DomEventType.Wheel:
      return WheelEvent
    case DomEventType.PointerDown:
    case DomEventType.PointerUp:
    case DomEventType.PointerMove:
      return PointerEvent
    case DomEventType.Click:
    case DomEventType.ContextMenu:
    case DomEventType.DoubleClick:
    case DomEventType.MouseEnter:
    case DomEventType.MouseLeave:
    case DomEventType.MouseDown:
    case DomEventType.MouseUp:
    case DomEventType.MouseMove:
      return MouseEvent
    case DomEventType.KeyDown:
    case DomEventType.KeyPress:
    case DomEventType.KeyUp:
      return KeyboardEvent
    case DomEventType.Input:
    case DomEventType.Change:
      return InputEvent
    default:
      return Event
  }
}
