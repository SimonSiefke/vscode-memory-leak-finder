import { test, expect } from '@jest/globals'
import { parseHeapSnapshotArrayHeader } from '../src/parts/ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'

test('parseHeapSnapshotArrayHeader - finds nodes array header', () => {
  const data = '"nodes":[1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(7) // Position after '['
})

test('parseHeapSnapshotArrayHeader - finds edges array header', () => {
  const data = '"edges":[4,5,6]'
  const result = parseHeapSnapshotArrayHeader(data, 'edges')
  
  expect(result).toBe(7) // Position after '['
})

test('parseHeapSnapshotArrayHeader - finds locations array header', () => {
  const data = '"locations":[7,8,9]'
  const result = parseHeapSnapshotArrayHeader(data, 'locations')
  
  expect(result).toBe(11) // Position after '['
})

test('parseHeapSnapshotArrayHeader - returns -1 when token not found', () => {
  const data = '"other":[1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(-1)
})

test('parseHeapSnapshotArrayHeader - returns -1 when no opening bracket found', () => {
  const data = '"nodes":'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(-1)
})

test('parseHeapSnapshotArrayHeader - handles whitespace around token', () => {
  const data = '  "nodes"  :  [1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(12) // Position after '['
})

test('parseHeapSnapshotArrayHeader - handles data with prefix', () => {
  const data = '{"snapshot":{},"nodes":[1,2,3]}'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(22) // Position after '['
})

test('parseHeapSnapshotArrayHeader - handles data with suffix', () => {
  const data = '"nodes":[1,2,3],"other":{}'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(7) // Position after '['
})

test('parseHeapSnapshotArrayHeader - handles empty array', () => {
  const data = '"nodes":[]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(7) // Position after '['
})

test('parseHeapSnapshotArrayHeader - handles case sensitive matching', () => {
  const data = '"Nodes":[1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(-1) // Should not match due to case difference
})

test('parseHeapSnapshotArrayHeader - handles multiple occurrences of token', () => {
  const data = '"nodes":[1,2,3],"nodes":[4,5,6]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(7) // Should find the first occurrence
})

test('parseHeapSnapshotArrayHeader - handles token as part of larger string', () => {
  const data = '"my_nodes":[1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(-1) // Should not match partial token
})

test('parseHeapSnapshotArrayHeader - handles token with special characters', () => {
  const data = '"node-fields":[1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'node-fields')
  
  expect(result).toBe(13) // Position after '['
})

test('parseHeapSnapshotArrayHeader - handles empty data', () => {
  const data = ''
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(-1)
})

test('parseHeapSnapshotArrayHeader - handles data without quotes', () => {
  const data = 'nodes:[1,2,3]'
  const result = parseHeapSnapshotArrayHeader(data, 'nodes')
  
  expect(result).toBe(-1) // Should not match without quotes
}) 