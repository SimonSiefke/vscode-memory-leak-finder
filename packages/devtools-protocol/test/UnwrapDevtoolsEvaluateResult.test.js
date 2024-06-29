import * as UnwrapDevtoolsEvaluateResult from '../src/parts/UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js'
import { test, expect } from '@jest/globals'

test('unwrapResult - undefined', () => {
  expect(
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      result: {
        result: {
          type: 'undefined',
        },
      },
    }),
  ).toBeUndefined()
})

test('unwrapResult - number', () => {
  expect(
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      result: {
        result: {
          type: 'number',
          value: 1,
        },
      },
    }),
  ).toBe(1)
})

test('unwrapResult - string', () => {
  expect(
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      result: {
        result: {
          type: 'number',
          value: 'test',
        },
      },
    }),
  ).toBe('test')
})

test('unwrapResult - object', () => {
  expect(
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      result: {
        result: {
          type: 'object',
          value: {},
        },
      },
    }),
  ).toEqual({})
})

test('unwrapResult - unknown value', () => {
  expect(() =>
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      id: 1,
    }),
  ).toThrowError(new Error(`Failed to unwrap devtools evaluate result`))
})

test('unwrapResult - result with empty object', () => {
  expect(
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      id: 2,
      result: {},
    }),
  ).toEqual({})
})

test('unwrapResult - wrapped null', () => {
  expect(UnwrapDevtoolsEvaluateResult.unwrapResult({ result: { result: { type: 'object', subtype: 'null', value: null } } })).toBe(null)
})

test('unwrapResult - result and internalProperties', () => {
  expect(
    UnwrapDevtoolsEvaluateResult.unwrapResult({
      result: {
        result: [],
        internalProperties: [],
      },
    }),
  ).toEqual({
    result: [],
    internalProperties: [],
  })
})

test('unwrapResult - dom counters', () => {
  const rawResult = {
    id: 9,
    result: { documents: 4, nodes: 1065, jsEventListeners: 1907 },
    sessionId: 'EC3785F8DB8BF6BAD8FAA4D8539CC71D',
  }
  expect(UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)).toEqual({
    documents: 4,
    nodes: 1065,
    jsEventListeners: 1907,
  })
})

test('unwrapResult - heap usage', () => {
  const rawResult = {
    id: 9,
    result: { usedSize: 58546384, totalSize: 72617984 },
    sessionId: '1E8CFE6179C022F428E3CCF6C2E0E7D4',
  }
  expect(UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)).toEqual({
    usedSize: 58546384,
    totalSize: 72617984,
  })
})

test('unwrapResult - global lexical scope names', () => {
  const rawResult = {
    id: 9,
    result: { names: [] },
    sessionId: '1E8CFE6179C022F428E3CCF6C2E0E7D4',
  }
  expect(UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)).toEqual({
    names: [],
  })
})
