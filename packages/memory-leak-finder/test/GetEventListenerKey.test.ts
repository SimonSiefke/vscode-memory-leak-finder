import { expect, test } from '@jest/globals'
import * as GetEventListenerKey from '../src/parts/GetEventListenerKey/GetEventListenerKey.ts'

test('getEventListenerKey includes the event type for locations', () => {
  const click = GetEventListenerKey.getEventListenerKey({
    location: 'file:///framework.js:1:2',
    type: 'click',
  })
  const keydown = GetEventListenerKey.getEventListenerKey({
    location: 'file:///framework.js:1:2',
    type: 'keydown',
  })

  expect(click).not.toBe(keydown)
})

test('getEventListenerKey includes the event type for stacks', () => {
  const stack = ['listener (file:///framework.js:1:2)']
  const click = GetEventListenerKey.getEventListenerKey({
    stack,
    type: 'click',
  })
  const keydown = GetEventListenerKey.getEventListenerKey({
    stack,
    type: 'keydown',
  })

  expect(click).not.toBe(keydown)
})

test('getEventListenerKey includes the event type for line and column locations', () => {
  const click = GetEventListenerKey.getEventListenerKey({
    columnNumber: 2,
    lineNumber: 1,
    type: 'click',
  })
  const keydown = GetEventListenerKey.getEventListenerKey({
    columnNumber: 2,
    lineNumber: 1,
    type: 'keydown',
  })

  expect(click).not.toBe(keydown)
})
