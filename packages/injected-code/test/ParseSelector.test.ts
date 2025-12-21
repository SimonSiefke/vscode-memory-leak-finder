import { test, expect } from '@jest/globals'
import * as ParseSelector from '../src/parts/ParseSelector/ParseSelector.ts'
import * as SelectorType from '../src/parts/SelectorType/SelectorType.ts'

test('parseSelector - empty', () => {
  const selector = ''
  expect(ParseSelector.parseSelector(selector)).toEqual([])
})

test('parseSelector - html element', () => {
  const selector = 'h1'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: 'h1',
      type: SelectorType.Css,
    },
  ])
})

test('parseSelector - role', () => {
  const selector = '[role="main"]'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: '[role="main"]',
      type: SelectorType.Css,
    },
  ])
})

test('parseSelector - nth of type', () => {
  const selector = ':nth-of-type(1)'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: ':nth-of-type(1)',
      type: SelectorType.Css,
    },
  ])
})

test('parseSelector - id', () => {
  const selector = '#main'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: '#main',
      type: SelectorType.Css,
    },
  ])
})

test('parseSelector - class', () => {
  const selector = '.focused'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: '.focused',
      type: SelectorType.Css,
    },
  ])
})

test('parseSelector - nth', () => {
  const selector = 'h1:nth(1)'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: 'h1',
      type: SelectorType.Css,
    },
    {
      body: ':nth(1)',
      type: SelectorType.Nth,
    },
  ])
})

test('parseSelector - enter iframe', () => {
  const selector = 'iframe:internal-enter-frame()'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: 'iframe',
      type: SelectorType.Css,
    },
    {
      body: ':internal-enter-frame()',
      type: SelectorType.InternalEnterFrame,
    },
  ])
})

test('parseSelector - enter shadow', () => {
  const selector = 'div:enter-shadow()'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: 'div',
      type: SelectorType.Css,
    },
    {
      body: ':enter-shadow()',
      type: SelectorType.EnterShadow,
    },
  ])
})

test('parseSelector - text', () => {
  const selector = 'h1:has-text("test")'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: 'h1',
      type: SelectorType.Css,
    },
    {
      body: ':has-text("test")',
      type: SelectorType.Text,
    },
  ])
})

test('parseSelector - text with colon', () => {
  const selector = 'h1:has-text("test: test")'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: 'h1',
      type: SelectorType.Css,
    },
    {
      body: ':has-text("test: test")',
      type: SelectorType.Text,
    },
  ])
})

test('parseSelector - mix', () => {
  const selector = '.editor-instance [class^="mtk"]:has-text("h1"):nth(0)'
  expect(ParseSelector.parseSelector(selector)).toEqual([
    {
      body: '.editor-instance [class^="mtk"]',
      type: SelectorType.Css,
    },
    {
      body: ':has-text("h1")',
      type: SelectorType.Text,
    },
    {
      body: ':nth(0)',
      type: SelectorType.Nth,
    },
  ])
})
