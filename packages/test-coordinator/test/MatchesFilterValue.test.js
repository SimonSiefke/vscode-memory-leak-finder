import * as MatchesFilterValue from '../src/parts/MatchesFilterValue/MatchesFilterValue.js'

test('matchesFilterValue - starts with - true', () => {
  expect(MatchesFilterValue.matchesFilterValue('abc', '^abc')).toBe(true)
})

test('matchesFilterValue - starts with - false', () => {
  expect(MatchesFilterValue.matchesFilterValue(' abc', '^abc')).toBe(false)
})

test('matchesFilterValue - substring', () => {
  expect(MatchesFilterValue.matchesFilterValue('abc', 'b')).toBe(true)
})
