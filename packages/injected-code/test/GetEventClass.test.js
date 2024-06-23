/**
 * @jest-environment jsdom
 */
import * as GetEventClass from '../src/parts/GetEventClass/GetEventClass.js'
import * as DomEventType from '../src/parts/DomEventType/DomEventType.js'
import { test, expect, beforeAll } from '@jest/globals'

beforeAll(() => {
  // @ts-ignore
  globalThis.PointerEvent = class {}
})

test('wheel events', () => {
  expect(GetEventClass.getEventClass(DomEventType.Wheel)).toBe(WheelEvent)
})

test('pointer events', () => {
  expect(GetEventClass.getEventClass(DomEventType.PointerDown)).toBe(PointerEvent)
  expect(GetEventClass.getEventClass(DomEventType.PointerUp)).toBe(PointerEvent)
  expect(GetEventClass.getEventClass(DomEventType.PointerMove)).toBe(PointerEvent)
})

test('mouse events', () => {
  expect(GetEventClass.getEventClass(DomEventType.Click)).toBe(MouseEvent)
  expect(GetEventClass.getEventClass(DomEventType.ContextMenu)).toBe(MouseEvent)
  expect(GetEventClass.getEventClass(DomEventType.DoubleClick)).toBe(MouseEvent)
  expect(GetEventClass.getEventClass(DomEventType.MouseEnter)).toBe(MouseEvent)
  expect(GetEventClass.getEventClass(DomEventType.MouseLeave)).toBe(MouseEvent)
  expect(GetEventClass.getEventClass(DomEventType.MouseDown)).toBe(MouseEvent)
  expect(GetEventClass.getEventClass(DomEventType.MouseUp)).toBe(MouseEvent)
})

test('keyboard events', () => {
  expect(GetEventClass.getEventClass(DomEventType.KeyDown)).toBe(KeyboardEvent)
  expect(GetEventClass.getEventClass(DomEventType.KeyPress)).toBe(KeyboardEvent)
  expect(GetEventClass.getEventClass(DomEventType.KeyUp)).toBe(KeyboardEvent)
})

test('input events', () => {
  expect(GetEventClass.getEventClass(DomEventType.Input)).toBe(InputEvent)
  expect(GetEventClass.getEventClass(DomEventType.Change)).toBe(InputEvent)
})
