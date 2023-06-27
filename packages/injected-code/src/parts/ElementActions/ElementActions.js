import * as DomEventType from '../DomEventType/DomEventType.js'

export const mouseEvent = (element, eventType, options) => {
  const event = new MouseEvent(eventType, options)
  element.dispatchEvent(event)
}

export const pointerEvent = (element, eventType, options) => {
  const event = new PointerEvent(eventType, options)
  element.dispatchEvent(event)
}

export const mouseDown = (element, options) => {
  mouseEvent(element, DomEventType.MouseDown, options)
}

export const mouseUp = (element, options) => {
  mouseEvent(element, DomEventType.MouseUp, options)
}

export const contextMenu = (element, options) => {
  mouseEvent(element, DomEventType.ContextMenu, options)
}

export const click = (element, options) => {
  mouseDown(element, options)
  mouseEvent(element, DomEventType.Click, options)
  mouseUp(element, options)
  if (options.button === 2 /* right */) {
    contextMenu(element, options)
  }
}

export const hover = (element, options) => {
  mouseEvent(element, DomEventType.MouseEnter, options)
}

export const type = (element, options) => {
  element.value = options.text
  const inputEvent = new InputEvent('input')
  element.dispatchEvent(inputEvent)
  const changeEvent = new InputEvent('change')
  element.dispatchEvent(changeEvent)
}

export const keyboardEvent = (element, eventType, options) => {
  const event = new KeyboardEvent(eventType, options)
  element.dispatchEvent(event)
}

export const keyDown = (element, options) => {
  keyboardEvent(element, DomEventType.KeyDown, options)
}

export const keyUp = (element, options) => {
  keyboardEvent(element, DomEventType.KeyUp, options)
}

export const keyPress = (element, options) => {
  keyboardEvent(element, DomEventType.KeyPress, options)
}

const getEventClass = (eventType) => {
  switch (eventType) {
    case DomEventType.Wheel:
      return WheelEvent
    case DomEventType.PointerDown:
    case DomEventType.PointerUp:
    case DomEventType.PointerMove:
      return PointerEvent
    default:
      return Event
  }
}

export const dispatchEvent = (element, options) => {
  const EventClass = getEventClass(options.type)
  const event = new EventClass(options.type, options.init)
  element.dispatchEvent(event)
}
