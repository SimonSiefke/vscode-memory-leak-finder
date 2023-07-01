import * as ParseSelector from '../src/parts/ParseSelector/ParseSelector.js'
import * as SelectorType from '../src/parts/SelectorType/SelectorType.js'

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

test('parseSelector - aria role', () => {
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
