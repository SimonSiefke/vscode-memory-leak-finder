import { expect, test } from '@jest/globals'
import * as CleanIpcMessages from '../src/parts/CleanIpcMessages/CleanIpcMessages.ts'

test('CleanIpcMessages should read a single byte integer', () => {
  const buffer = Buffer.from([0x42])
  const result = CleanIpcMessages.readIntVQL(buffer, 0)
  expect(result.value).toBe(0x42)
  expect(result.bytesRead).toBe(1)
})

test('CleanIpcMessages should read a multi-byte integer', () => {
  // 0x80 0x01 = 128 (0x80 has continuation bit, 0x01 is the next byte)
  const buffer = Buffer.from([0x80, 0x01])
  const result = CleanIpcMessages.readIntVQL(buffer, 0)
  expect(result.value).toBe(128)
  expect(result.bytesRead).toBe(2)
})

test('CleanIpcMessages should read a larger multi-byte integer', () => {
  // 0x81 0x80 0x01 = 129 + 128*128 = 16513
  const buffer = Buffer.from([0x81, 0x80, 0x01])
  const result = CleanIpcMessages.readIntVQL(buffer, 0)
  expect(result.value).toBe(16513)
  expect(result.bytesRead).toBe(3)
})

test('CleanIpcMessages should read with offset', () => {
  const buffer = Buffer.from([0x00, 0x42])
  const result = CleanIpcMessages.readIntVQL(buffer, 1)
  expect(result.value).toBe(0x42)
  expect(result.bytesRead).toBe(1)
})

test('CleanIpcMessages should deserialize undefined', () => {
  const buffer = Buffer.from([CleanIpcMessages.DataType.Undefined])
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toBeUndefined()
  expect(result.bytesRead).toBe(1)
})

test('CleanIpcMessages should deserialize a string', () => {
  const str = 'hello'
  const strBytes = Buffer.from(str, 'utf8')
  const lengthBytes = Buffer.from([strBytes.length])
  const buffer = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.String]), lengthBytes, strBytes])
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toBe(str)
  expect(result.bytesRead).toBe(1 + 1 + strBytes.length)
})

test('CleanIpcMessages should deserialize a buffer', () => {
  const data = Buffer.from([0x01, 0x02, 0x03])
  const lengthBytes = Buffer.from([data.length])
  const buffer = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.Buffer]), lengthBytes, data])
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toEqual(data)
  expect(result.bytesRead).toBe(1 + 1 + data.length)
})

test('CleanIpcMessages should deserialize a VSBuffer', () => {
  const data = Buffer.from([0x01, 0x02, 0x03])
  const lengthBytes = Buffer.from([data.length])
  const buffer = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.VSBuffer]), lengthBytes, data])
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toEqual(data)
  expect(result.bytesRead).toBe(1 + 1 + data.length)
})

test('CleanIpcMessages should deserialize an array', () => {
  // Array with 2 elements: "hello" and 42
  const str = 'hello'
  const strBytes = Buffer.from(str, 'utf8')
  const strLengthBytes = Buffer.from([strBytes.length])

  const int = 42
  const intBytes = Buffer.from([int])

  const buffer = Buffer.concat([
    Buffer.from([CleanIpcMessages.DataType.Array]),
    Buffer.from([2]), // length
    Buffer.from([CleanIpcMessages.DataType.String]),
    strLengthBytes,
    strBytes,
    Buffer.from([CleanIpcMessages.DataType.Int]),
    intBytes,
  ])

  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toEqual([str, int])
})

test('CleanIpcMessages should deserialize an object', () => {
  const obj = { key: 'value', num: 123 }
  const json = JSON.stringify(obj)
  const jsonBytes = Buffer.from(json, 'utf8')
  const lengthBytes = Buffer.from([jsonBytes.length])

  const buffer = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.Object]), lengthBytes, jsonBytes])

  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toEqual(obj)
})

test('CleanIpcMessages should deserialize an integer', () => {
  const buffer = Buffer.from([CleanIpcMessages.DataType.Int, 42])
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toBe(42)
  expect(result.bytesRead).toBe(2)
})

test('CleanIpcMessages should handle unknown type', () => {
  const buffer = Buffer.from([99]) // unknown type
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toBeUndefined()
  expect(result.bytesRead).toBe(1)
})

test('CleanIpcMessages should handle empty buffer', () => {
  const buffer = Buffer.from([])
  const result = CleanIpcMessages.deserialize(buffer)
  expect(result.value).toBeUndefined()
  expect(result.bytesRead).toBe(0)
})

test('CleanIpcMessages should return empty array for empty input', () => {
  const result = CleanIpcMessages.cleanMessages([])
  expect(result).toEqual([])
})

test('CleanIpcMessages should pass through messages without uint8array args', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      args: ['string', 123, { key: 'value' }],
    },
  ]
  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result).toEqual(messages)
})

test('CleanIpcMessages should deserialize uint8array args', () => {
  // Create a simple VSCode binary message
  const str = 'test'
  const strBytes = Buffer.from(str, 'utf8')
  const lengthBytes = Buffer.from([strBytes.length])
  const binary = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.String]), lengthBytes, strBytes])

  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      args: [
        {
          type: 'uint8array',
          length: binary.length,
          content: binary.toString('utf8'),
        },
      ],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].args[0].type).toBe('deserialized')
  expect(result[0].args[0].value).toBe(str)
})

test('CleanIpcMessages should handle uint8array with invalid binary data', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      args: [
        {
          type: 'uint8array',
          length: 10,
          content: '\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF', // Invalid binary data
        },
      ],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  // Should return the original if deserialization fails
  expect(result[0].args[0].type).toBe('uint8array')
})

test('CleanIpcMessages should deserialize uint8array result', () => {
  // Create a simple VSCode binary message
  const str = 'result'
  const strBytes = Buffer.from(str, 'utf8')
  const lengthBytes = Buffer.from([strBytes.length])
  const binary = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.String]), lengthBytes, strBytes])

  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'handle-response',
      result: {
        type: 'uint8array',
        length: binary.length,
        content: binary.toString('utf8'),
      },
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].result.type).toBe('deserialized')
  expect(result[0].result.value).toBe(str)
})

test('CleanIpcMessages should handle buffer type args', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      args: [
        {
          type: 'buffer',
          length: 5,
          content: 'hello',
        },
      ],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  // Buffer type should be passed through
  expect(result[0].args[0].type).toBe('buffer')
})

test('CleanIpcMessages should handle complex nested messages', () => {
  // Create a complex VSCode binary message with array
  const str = 'logger'
  const strBytes = Buffer.from(str, 'utf8')
  const strLengthBytes = Buffer.from([strBytes.length])

  const method = 'onDidChangeVisibility'
  const methodBytes = Buffer.from(method, 'utf8')
  const methodLengthBytes = Buffer.from([methodBytes.length])

  const binary = Buffer.concat([
    Buffer.from([CleanIpcMessages.DataType.Array]),
    Buffer.from([3]), // length
    Buffer.from([CleanIpcMessages.DataType.String]),
    strLengthBytes,
    strBytes,
    Buffer.from([CleanIpcMessages.DataType.String]),
    methodLengthBytes,
    methodBytes,
    Buffer.from([CleanIpcMessages.DataType.Array]),
    Buffer.from([0]), // empty array
  ])

  const messages = [
    {
      channel: 'vscode:message',
      timestamp: 1769120897696,
      type: 'on',
      args: [
        {
          type: 'uint8array',
          length: binary.length,
          content: binary.toString('utf8'),
        },
      ],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].args[0].type).toBe('deserialized')
  expect(result[0].args[0].value).toEqual(['logger', 'onDidChangeVisibility', []])
})

test('CleanIpcMessages should handle multiple args with mixed types', () => {
  const str = 'test'
  const strBytes = Buffer.from(str, 'utf8')
  const lengthBytes = Buffer.from([strBytes.length])
  const binary = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.String]), lengthBytes, strBytes])

  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      args: [
        'regular string',
        {
          type: 'uint8array',
          length: binary.length,
          content: binary.toString('utf8'),
        },
        123,
        { key: 'value' },
      ],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].args[0]).toBe('regular string')
  expect(result[0].args[1].type).toBe('deserialized')
  expect(result[0].args[1].value).toBe(str)
  expect(result[0].args[2]).toBe(123)
  expect(result[0].args[3]).toEqual({ key: 'value' })
})

test('CleanIpcMessages should handle messages without args', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result).toEqual(messages)
})

test('CleanIpcMessages should handle messages with empty args array', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      args: [],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].args).toEqual([])
})

test('CleanIpcMessages should handle handle-error messages', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'handle-error',
      error: 'Something went wrong',
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result).toEqual(messages)
})

test('CleanIpcMessages should handle handle-request messages with uint8array', () => {
  const str = 'request'
  const strBytes = Buffer.from(str, 'utf8')
  const lengthBytes = Buffer.from([strBytes.length])
  const binary = Buffer.concat([Buffer.from([CleanIpcMessages.DataType.String]), lengthBytes, strBytes])

  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'handle-request',
      args: [
        {
          type: 'uint8array',
          length: binary.length,
          content: binary.toString('utf8'),
        },
      ],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].args[0].type).toBe('deserialized')
  expect(result[0].args[0].value).toBe(str)
})

test('CleanIpcMessages should preserve all other message properties', () => {
  const messages = [
    {
      channel: 'test',
      timestamp: 123,
      type: 'on',
      customProp: 'custom value',
      args: ['arg1'],
    },
  ]

  const result = CleanIpcMessages.cleanMessages(messages)
  expect(result[0].channel).toBe('test')
  expect(result[0].timestamp).toBe(123)
  expect(result[0].type).toBe('on')
  expect(result[0].customProp).toBe('custom value')
  expect(result[0].args).toEqual(['arg1'])
})