import { expect, test } from '@jest/globals'
import * as HashRequestBody from '../src/parts/HashRequestBody/HashRequestBody.ts'

test('normalizeRequestBody filters out reasoning entries', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'input_text', text: 'test' },
        { type: 'reasoning', id: 'reasoning1' },
        { type: 'function_call', call_id: 'call_abc123', name: 'test_func' },
        { type: 'reasoning', id: 'reasoning2' },
        { type: 'function_call_output', call_id: 'call_abc123', output: 'result' },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.input).toHaveLength(3)
  expect(parsed.input.find((e: any) => e.type === 'reasoning')).toBeUndefined()
  expect(parsed.input.find((e: any) => e.type === 'input_text')).toBeDefined()
  expect(parsed.input.find((e: any) => e.type === 'function_call')).toBeDefined()
  expect(parsed.input.find((e: any) => e.type === 'function_call_output')).toBeDefined()
})

test('normalizeRequestBody normalizes function_call IDs to sequential numbers', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', call_id: 'call_QER56C3q4PLD4rIClJF8W9EV', name: 'func1' },
        { type: 'function_call', call_id: 'call_0lZLqe2uOjfptJBlJY2XI682', name: 'func2' },
        { type: 'function_call', call_id: 'call_671Zgq6PfKk19XqQPsiRQZQN', name: 'func3' },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.input[0].call_id).toBe('call_1')
  expect(parsed.input[1].call_id).toBe('call_2')
  expect(parsed.input[2].call_id).toBe('call_3')
})

test('normalizeRequestBody matches function_call and function_call_output IDs', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', call_id: 'call_abc123', name: 'test_func' },
        { type: 'function_call_output', call_id: 'call_abc123', output: 'result1' },
        { type: 'function_call', call_id: 'call_xyz789', name: 'test_func2' },
        { type: 'function_call_output', call_id: 'call_xyz789', output: 'result2' },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  const functionCall1 = parsed.input.find((e: any) => e.type === 'function_call' && e.name === 'test_func')
  const functionCallOutput1 = parsed.input.find((e: any) => e.type === 'function_call_output' && e.output === 'result1')
  const functionCall2 = parsed.input.find((e: any) => e.type === 'function_call' && e.name === 'test_func2')
  const functionCallOutput2 = parsed.input.find((e: any) => e.type === 'function_call_output' && e.output === 'result2')

  expect(functionCall1.call_id).toBe('call_1')
  expect(functionCallOutput1.call_id).toBe('call_1')
  expect(functionCall2.call_id).toBe('call_2')
  expect(functionCallOutput2.call_id).toBe('call_2')
})

test('normalizeRequestBody handles function_call_output without matching function_call', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [{ type: 'function_call_output', call_id: 'call_orphan', output: 'result' }],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  // Should keep the original call_id if no matching function_call exists
  expect(parsed.input[0].call_id).toBe('call_orphan')
})

test('normalizeRequestBody handles function_call without call_id', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', name: 'test_func' },
        { type: 'function_call', call_id: 'call_abc123', name: 'test_func2' },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.input[0].call_id).toBeUndefined()
  expect(parsed.input[1].call_id).toBe('call_1')
})

test('normalizeRequestBody preserves other properties', () => {
  const body = Buffer.from(
    JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        { type: 'function_call', call_id: 'call_abc123', name: 'test_func', arguments: '{"key": "value"}' },
        { type: 'function_call_output', call_id: 'call_abc123', output: 'result', status: 'completed' },
      ],
      stream: true,
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.model).toBe('gpt-5-mini')
  expect(parsed.stream).toBe(true)
  expect(parsed.input[0].name).toBe('test_func')
  expect(parsed.input[0].arguments).toBe('{"key": "value"}')
  expect(parsed.input[1].output).toBe('result')
  expect(parsed.input[1].status).toBe('completed')
})

test('normalizeRequestBody returns original body if not JSON', () => {
  const body = Buffer.from('not json', 'utf8')

  const normalized = HashRequestBody.normalizeRequestBody(body)

  expect(normalized.toString('utf8')).toBe('not json')
})

test('normalizeRequestBody returns original body if no input property', () => {
  const body = Buffer.from(
    JSON.stringify({
      model: 'gpt-5-mini',
      otherProperty: 'value',
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)

  expect(normalized.toString('utf8')).toBe(body.toString('utf8'))
})

test('normalizeRequestBody returns original body if input is not an array', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: 'not an array',
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)

  expect(normalized.toString('utf8')).toBe(body.toString('utf8'))
})

test('normalizeRequestBody handles empty input array', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.input).toEqual([])
})

test('normalizeRequestBody handles input with only reasoning entries', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'reasoning', id: 'reasoning1' },
        { type: 'reasoning', id: 'reasoning2' },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.input).toEqual([])
})

test('normalizeRequestBody handles mixed entry types', () => {
  const body = Buffer.from(
    JSON.stringify({
      input: [
        { role: 'user', content: [{ type: 'input_text', text: 'hello' }] },
        { type: 'reasoning', id: 'reasoning1' },
        { type: 'function_call', call_id: 'call_abc123', name: 'test_func' },
        { role: 'assistant', content: [{ type: 'output_text', text: 'hi' }] },
        { type: 'function_call_output', call_id: 'call_abc123', output: 'result' },
        { type: 'reasoning', id: 'reasoning2' },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  expect(parsed.input).toHaveLength(4)
  expect(parsed.input.find((e: any) => e.type === 'reasoning')).toBeUndefined()
  expect(parsed.input.find((e: any) => e.role === 'user')).toBeDefined()
  expect(parsed.input.find((e: any) => e.role === 'assistant')).toBeDefined()

  const functionCall = parsed.input.find((e: any) => e.type === 'function_call')
  const functionCallOutput = parsed.input.find((e: any) => e.type === 'function_call_output')

  expect(functionCall.call_id).toBe('call_1')
  expect(functionCallOutput.call_id).toBe('call_1')
})

test('normalizeRequestBody handles complex nested structure from example', () => {
  const body = Buffer.from(
    JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: 'You are an expert' }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: 'test' }],
        },
        {
          type: 'reasoning',
          id: '7tEmA68mZxuLlU3znXh+c2EzTfcGefCQm24jHyw9uFrjyRJHidnykIxoomqA2IlUWUXKweKxo7Y9QcBOe2UJl/Y8URTrUsHGR4mkgzi8/2/C2v9LEojqCQN2CuI4JZjmuuY10Czz/5wB3u4iEnFO9P1tLoabf7YvQZkggkc380Ap+Qx+rE/0itoUEsM1U6xXsddlLRE0alUukWSjFRLNX5y5VuqucAJZvheDSnvhOspTobe+tLIHe3x7xUlZJpO+iU6Zm0aYBEyKJbCQSQuYPgbtdCiizmA/OXznYi+jNfqy81rC+RGxNaXjTfOvQohpk2cLZjVSR+R/Ao7LRVZFU3mwQ1SnviorCzhTkPRolKKQ3UUcNYw09EGJfdw5Q/hsCdqWSIaY46wb/C2gHZ3w5PlrDg==',
        },
        {
          type: 'function_call',
          name: 'manage_todo_list',
          arguments: '{"operation":"write"}',
          call_id: 'call_0lZLqe2uOjfptJBlJY2XI682',
        },
        {
          type: 'function_call_output',
          call_id: 'call_0lZLqe2uOjfptJBlJY2XI682',
          output: 'Successfully wrote todo list',
        },
        {
          type: 'function_call',
          name: 'read_file',
          arguments: '{"filePath":"/path/to/file"}',
          call_id: 'call_671Zgq6PfKk19XqQPsiRQZQN',
        },
        {
          type: 'function_call_output',
          call_id: 'call_671Zgq6PfKk19XqQPsiRQZQN',
          output: 'file content',
        },
        {
          type: 'reasoning',
          id: 'HoeMn28Rk700rWzjGb1nDVVJht+H6UvQhdSIPJJpa4IlWyAIdgmWwWewvVbVFKfZfmErRjrGRL3KTlqczXwmiBR96ZLH0AhmzJS+EtYcejXUMxqwkrlR0dknRqmqhGGREKc2xkQMKw7RCmG2UkgwSKiepIEV6EYcAJiXiKLhsLcThR/lMpn32Nm6fs39BsmvshoYU8Lz4hJE2V3MjKIaZjfKo6qzBpvnt8jtN2UYRAp1Nkk9tDJzESJVSApWVu4W9ZpC2HRxAZ15W8kJ84nv9xI49otCISlAknvVjcvW8zYZnl9iHqv5uwcgLLrqafXN0eGXul9dOFxOgVwJxP7ka+JRwJsjme0DflmfDx05IYgc3aWZv7F0ET3UV+k6zOcJa0IL3WuFKQ7Mn1BXkvHaxj5L4w==',
        },
        {
          type: 'function_call',
          name: 'run_in_terminal',
          arguments: '{"command":"node index.js"}',
          call_id: 'call_QER56C3q4PLD4rIClJF8W9EV',
        },
        {
          type: 'function_call_output',
          call_id: 'call_QER56C3q4PLD4rIClJF8W9EV',
          output: 'Command executed',
        },
      ],
    }),
    'utf8',
  )

  const normalized = HashRequestBody.normalizeRequestBody(body)
  const parsed = JSON.parse(normalized.toString('utf8'))

  // Should filter out 2 reasoning entries
  expect(parsed.input).toHaveLength(8)

  // Check that function calls are normalized sequentially
  const functionCalls = parsed.input.filter((e: any) => e.type === 'function_call')
  expect(functionCalls[0].call_id).toBe('call_1')
  expect(functionCalls[1].call_id).toBe('call_2')
  expect(functionCalls[2].call_id).toBe('call_3')

  // Check that function_call_output IDs match
  const functionCallOutputs = parsed.input.filter((e: any) => e.type === 'function_call_output')
  expect(functionCallOutputs[0].call_id).toBe('call_1')
  expect(functionCallOutputs[1].call_id).toBe('call_2')
  expect(functionCallOutputs[2].call_id).toBe('call_3')

  // Verify other properties are preserved
  expect(parsed.model).toBe('gpt-5-mini')
  expect(parsed.input.find((e: any) => e.role === 'system')).toBeDefined()
  expect(parsed.input.find((e: any) => e.role === 'user')).toBeDefined()
})

test('hashRequestBody produces consistent hashes for normalized bodies', () => {
  const body1 = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', call_id: 'call_abc123', name: 'test_func' },
        { type: 'function_call_output', call_id: 'call_abc123', output: 'result' },
      ],
    }),
    'utf8',
  )

  const body2 = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', call_id: 'call_xyz789', name: 'test_func' },
        { type: 'function_call_output', call_id: 'call_xyz789', output: 'result' },
      ],
    }),
    'utf8',
  )

  const hash1 = HashRequestBody.hashRequestBody(body1)
  const hash2 = HashRequestBody.hashRequestBody(body2)

  // Both should produce the same hash after normalization
  expect(hash1).toBe(hash2)
})

test('hashRequestBody produces different hashes for different function names', () => {
  const body1 = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', call_id: 'call_abc123', name: 'func1' },
        { type: 'function_call_output', call_id: 'call_abc123', output: 'result' },
      ],
    }),
    'utf8',
  )

  const body2 = Buffer.from(
    JSON.stringify({
      input: [
        { type: 'function_call', call_id: 'call_xyz789', name: 'func2' },
        { type: 'function_call_output', call_id: 'call_xyz789', output: 'result' },
      ],
    }),
    'utf8',
  )

  const hash1 = HashRequestBody.hashRequestBody(body1)
  const hash2 = HashRequestBody.hashRequestBody(body2)

  // Should produce different hashes due to different function names
  expect(hash1).not.toBe(hash2)
})
