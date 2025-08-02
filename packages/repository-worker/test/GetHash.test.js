import { test, expect } from '@jest/globals'
import { getHash } from '../src/parts/GetHash/GetHash.js'

test('getHash - generates hash from single string', () => {
  const result = getHash(['hello world'])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - generates hash from multiple strings', () => {
  const result = getHash(['hello', 'world', 'test'])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - generates hash from empty array', () => {
  const result = getHash([])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - generates hash from Buffer', () => {
  const buffer = Buffer.from('hello world', 'utf8')
  const result = getHash([buffer])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - generates hash from mixed strings and buffers', () => {
  const buffer = Buffer.from('hello', 'utf8')
  const result = getHash([buffer, 'world', 'test'])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - generates consistent hash for same input', () => {
  const input = ['hello', 'world']
  const result1 = getHash(input)
  const result2 = getHash(input)

  expect(result1).toBe(result2)
})

test('getHash - generates different hash for different input', () => {
  const input1 = ['hello', 'world']
  const input2 = ['hello', 'world!']
  const result1 = getHash(input1)
  const result2 = getHash(input2)

  expect(result1).not.toBe(result2)
})

test('getHash - generates different hash for different order', () => {
  const input1 = ['hello', 'world']
  const input2 = ['world', 'hello']
  const result1 = getHash(input1)
  const result2 = getHash(input2)

  expect(result1).not.toBe(result2)
})

test('getHash - handles empty strings', () => {
  const result = getHash(['', 'hello', ''])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - handles large content', () => {
  const largeString = 'x'.repeat(10000)
  const result = getHash([largeString])

  expect(typeof result).toBe('string')
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
})

test('getHash - generates expected SHA1 hash for known input', () => {
  // SHA1 hash of "hello world" is 2aae6c35c94fcfb415dbe95f408b9ce91ee846ed
  const result = getHash(['hello world'])

  expect(result).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed')
})

test('getHash - generates expected SHA1 hash for empty input', () => {
  // SHA1 hash of empty string is da39a3ee5e6b4b0d3255bfef95601890afd80709
  const result = getHash([''])

  expect(result).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
})
