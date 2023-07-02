import * as DomEventType from '../DomEventType/DomEventType.js'
import * as KeyBoardActions from '../KeyBoardActions/KeyBoardActions.js'

const emitEvent = (element, constructor, eventType, options) => {
  const event = new constructor(eventType, options)
  element.dispatchEvent(event)
}

export const mouseEvent = (element, eventType, options) => {
  emitEvent(element, MouseEvent, eventType, options)
}

export const pointerEvent = (element, eventType, options) => {
  emitEvent(element, PointerEvent, eventType, options)
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

export const dblclick = (element, options) => {
  click(element, options)
  click(element, options)
  mouseEvent(element, DomEventType.DoubleClick, options)
}

export const hover = (element, options) => {
  mouseEvent(element, DomEventType.MouseEnter, options)
}

export const focus = (element) => {
  element.focus()
}

export const clear = (element) => {
  element.value = ''
}

export const selectText = (element) => {
  element.setSelectionRange(0, element.value.length)
}

export const type = (element, options) => {
  element.value = element.value + options.text
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

export const press = (element, options) => {
  return KeyBoardActions.press(options, element)
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
