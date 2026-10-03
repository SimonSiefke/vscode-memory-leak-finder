import { runInNewContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import { install } from '../src/parts/SynchronousDomReadCountWithStackTracesTracker/SynchronousDomReadCountWithStackTracesTracker.ts'

test('counts reads, preserves setters and exceptions, restores descriptors', () => {
  class Element {
    value = 7
    get clientWidth() {
      return this.value
    }
    get scrollTop() {
      return this.value
    }
    set scrollTop(value) {
      this.value = value
    }
    getBoundingClientRect() {
      return { width: this.value }
    }
  }
  class HTMLElement extends Element {
    get offsetWidth() {
      return this.value
    }
  }
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  const tracker = runInNewContext(`(${install.toString()})()`, { Element, HTMLElement })
  try {
    const element = new HTMLElement()
    expect(element.offsetWidth).toBe(7)
    element.scrollTop = 9
    expect(element.clientWidth).toBe(9)
    expect(element.getBoundingClientRect()).toEqual({ width: 9 })
    expect(() => Reflect.apply(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!.get!, null, [])).toThrow()
    const snapshot = tracker.snapshot()
    expect(snapshot.metrics.count).toBe(3)
    expect(snapshot.apiCounts['HTMLElement.offsetWidth']).toBe(1)
    expect(snapshot.captureStacks).toBe(true)
    expect(snapshot.unsupportedApis).toContain('window.getComputedStyle')
    expect(snapshot.rows[0].name).toContain('HTMLElement.offsetWidth')
  } finally {
    tracker.dispose()
  }
  expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')).toEqual(original)
})

test('cleanup preserves a subsequent application replacement', () => {
  class Element {
    getBoundingClientRect() {
      return 1
    }
  }
  const tracker = runInNewContext(`(${install.toString()})()`, { Element })
  const replacement = () => 42
  Element.prototype.getBoundingClientRect = replacement
  tracker.dispose()
  expect(Element.prototype.getBoundingClientRect).toBe(replacement)
})

test('missing browser APIs are explicitly unavailable', () => {
  const tracker = runInNewContext(`(${install.toString()})()`, {})
  expect(tracker.snapshot().available).toBe(false)
  tracker.dispose()
})
