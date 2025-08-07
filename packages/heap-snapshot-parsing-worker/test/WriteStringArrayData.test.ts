import { test, expect } from '@jest/globals'
import { writeStringArrayData } from '../src/parts/WriteStringArrayData/WriteStringArrayData.ts'

test('writeStringArrayData - parses strings section from actual heap snapshot format', () => {
  const strings: string[] = []
  let data = new Uint8Array()
  
  // Simulate the transition from locations to strings
  const chunk = new TextEncoder().encode('],"strings":["<dummy>","","(GC roots)","(Bootstrapper)","(Builtins)","(Client heap)","(Code flusher)","(Compilation cache)"]}')
  
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
  expect(strings.length).toBeGreaterThan(0)
  expect(strings[0]).toBe('<dummy>')
  expect(strings[1]).toBe('')
  expect(strings[2]).toBe('(GC roots)')
})

test('writeStringArrayData - handles data that starts with strings array content', () => {
  const strings: string[] = []
  let data = new Uint8Array()
  
  // This is the actual data format being passed to the function
  const chunk = new TextEncoder().encode('"<dummy>","","(GC roots)","(Bootstrapper)","(Builtins)","(Client heap)","(Code flusher)","(Compilation cache)"]}')
  
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
  expect(strings.length).toBeGreaterThan(0)
  expect(strings[0]).toBe('<dummy>')
  expect(strings[1]).toBe('')
  expect(strings[2]).toBe('(GC roots)')
})
