import * as UnwrapDevtoolsEvaluateResult from '../src/parts/UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js'

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
