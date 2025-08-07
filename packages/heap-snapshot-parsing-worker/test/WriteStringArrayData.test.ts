import { test, expect } from '@jest/globals'
import { writeStringArrayData } from '../src/parts/WriteStringArrayData/WriteStringArrayData.ts'

test('writeStringArrayData - parses complete string array', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('"hello","world","test"]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['hello', 'world', 'test'])
  expect(data.length).toBe(0) // No remaining data
})

test('writeStringArrayData - handles incomplete data', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  // First chunk with incomplete string
  const chunk1 = new TextEncoder().encode('"hello","wor')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success1 = writeStringArrayData(chunk1, data, strings, onReset, onDone, onDataUpdate)

  expect(success1).toBe(false) // Not done yet
  expect(strings).toEqual(['hello']) // Only first string parsed
  expect(data.length).toBeGreaterThan(0) // Some data remaining

  // Second chunk with rest of data
  const chunk2 = new TextEncoder().encode('ld","test"]')

  const success2 = writeStringArrayData(chunk2, data, strings, onReset, onDone, onDataUpdate)

  expect(success2).toBe(true) // Now done
  expect(strings).toEqual(['hello', 'world', 'test'])
  expect(data.length).toBe(0) // No remaining data
})

test('writeStringArrayData - handles empty strings', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('"","hello",""]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['', 'hello', ''])
})

test('writeStringArrayData - handles escaped quotes', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('"hello\\"world","test\\"string"]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['hello"world', 'test"string'])
})

test('writeStringArrayData - handles whitespace and commas', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('  "hello" , "world" , "test"  ]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['hello', 'world', 'test'])
})

test('writeStringArrayData - handles single string', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('"hello"]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['hello'])
})

test('writeStringArrayData - handles no strings', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode(']')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual([])
})

test('writeStringArrayData - handles partial string at end', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  // First chunk with complete strings and partial last string
  const chunk1 = new TextEncoder().encode('"hello","world","te')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success1 = writeStringArrayData(chunk1, data, strings, onReset, onDone, onDataUpdate)

  expect(success1).toBe(false) // Not done yet
  expect(strings).toEqual(['hello', 'world']) // Only first two strings parsed

  // Second chunk with rest of last string
  const chunk2 = new TextEncoder().encode('st"]')

  const success2 = writeStringArrayData(chunk2, data, strings, onReset, onDone, onDataUpdate)

  expect(success2).toBe(true) // Now done
  expect(strings).toEqual(['hello', 'world', 'test'])
})

test('writeStringArrayData - handles escaped backslashes', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('"hello\\\\world","test\\\\string"]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['hello\\world', 'test\\string'])
})

test('writeStringArrayData - handles mixed escaped characters', () => {
  const strings: string[] = []
  let data = new Uint8Array()

  const chunk = new TextEncoder().encode('"hello\\"world\\\\test","simple"]')

  const onReset = () => {
    // Reset parsing state
  }

  const onDone = () => {
    // Mark as done
  }

  const onDataUpdate = (newData: Uint8Array) => {
    data = newData
  }

  const success = writeStringArrayData(chunk, data, strings, onReset, onDone, onDataUpdate)

  expect(success).toBe(true)
  expect(strings).toEqual(['hello"world\\test', 'simple'])
})
