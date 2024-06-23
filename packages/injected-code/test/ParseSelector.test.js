import * as ParseSelector from '../src/parts/ParseSelector/ParseSelector.js'
import * as SelectorType from '../src/parts/SelectorType/SelectorType.js'
import { test, expect } from '@jest/globals'

test('parseSelector - empty', () => {
  const selector = ''
  expect(ParseSelector.parseSelector(selector)).toEqual([])
})

test('parseSelector - html element', () => {
  const selector = 'h1'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: 'h1',
    },
  ])
})

test('parseSelector - role', () => {
  const selector = '[role="main"]'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: '[role="main"]',
    },
  ])
})

test('parseSelector - nth of type', () => {
  const selector = ':nth-of-type(1)'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: ':nth-of-type(1)',
    },
  ])
})

test('parseSelector - id', () => {
  const selector = '#main'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: '#main',
    },
  ])
})

test('parseSelector - class', () => {
  const selector = '.focused'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: '.focused',
    },
  ])
})

test('parseSelector - nth', () => {
  const selector = 'h1:nth(1)'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: 'h1',
    },
    {
      type: SelectorType.Nth,
      body: ':nth(1)',
    },
  ])
})

test('parseSelector - enter iframe', () => {
  const selector = 'iframe:internal-enter-frame()'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: 'iframe',
    },
    {
      type: SelectorType.InternalEnterFrame,
      body: ':internal-enter-frame()',
    },
  ])
})
test('parseSelector - enter shadow', () => {
  const selector = 'div:enter-shadow()'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: 'div',
    },
    {
      type: SelectorType.EnterShadow,
      body: ':enter-shadow()',
    },
  ])
})

test('parseSelector - text', () => {
  const selector = 'h1:has-text("test")'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: 'h1',
    },
    {
      type: SelectorType.Text,
      body: ':has-text("test")',
    },
  ])
})

test('parseSelector - text with colon', () => {
  const selector = 'h1:has-text("test: test")'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: 'h1',
    },
    {
      type: SelectorType.Text,
      body: ':has-text("test: test")',
    },
  ])
})

test('parseSelector - mix', () => {
  const selector = '.editor-instance [class^="mtk"]:has-text("h1"):nth(0)'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      type: SelectorType.Css,
      body: '.editor-instance [class^="mtk"]',
    },
    {
      type: SelectorType.Text,
      body: ':has-text("h1")',
    },
    {
      type: SelectorType.Nth,
      body: ':nth(0)',
    },
  ])
})
