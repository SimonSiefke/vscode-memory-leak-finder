import * as DomEventType from '../DomEventType/DomEventType.ts'

export const getEventClass = (eventType: string): any => {
  switch (eventType) {
    case DomEventType.Change:
    case DomEventType.Input:
      return InputEvent
    case DomEventType.Click:
    case DomEventType.ContextMenu:
    case DomEventType.DoubleClick:
    case DomEventType.MouseDown:
    case DomEventType.MouseEnter:
    case DomEventType.MouseLeave:
    case DomEventType.MouseMove:
    case DomEventType.MouseUp:
      return MouseEvent
    case DomEventType.KeyDown:
    case DomEventType.KeyPress:
    case DomEventType.KeyUp:
      return KeyboardEvent
    case DomEventType.PointerDown:
    case DomEventType.PointerMove:
    case DomEventType.PointerUp:
      return PointerEvent
    case DomEventType.Wheel:
      return WheelEvent
    default:
      return Event
  }
}
