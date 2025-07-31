import { performance } from 'perf_hooks'

// Simulate the old approach with concatenation
function oldApproach(chunks) {
  let data = new Uint8Array()
  const array = new Uint32Array(1000)
  let arrayIndex = 0

  for (const chunk of chunks) {
    // This is the expensive concatenation we're eliminating
    data = concatArray(data, chunk)

    // Parse the concatenated data
    const result = parseHeapSnapshotArray(data, array, arrayIndex)
    arrayIndex = result.arrayIndex

    // Keep leftover data
    data = data.slice(result.dataIndex)
  }

  return arrayIndex
}

// Simulate the new approach with stateful parsing
function newApproach(chunks) {
  const array = new Uint32Array(1000)
  let arrayIndex = 0
  let currentNumber = 0
  let hasDigits = false

  for (const chunk of chunks) {
    // No concatenation needed - parse directly with state
    const result = parseHeapSnapshotArray(chunk, array, arrayIndex, currentNumber, hasDigits)
    arrayIndex = result.arrayIndex
    currentNumber = result.currentNumber
    hasDigits = result.hasDigits
  }

  return arrayIndex
}

// Helper function to simulate concatenation
function concatArray(a, b) {
  const result = new Uint8Array(a.length + b.length)
  result.set(a, 0)
  result.set(b, a.length)
  return result
}

// Import the actual parsing function
import { parseHeapSnapshotArray } from '../src/parts/ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

// Create test data with numbers split across chunk boundaries
function createTestChunks() {
  const numbers = []
  for (let i = 0; i < 500; i++) {
    numbers.push(i)
  }

  const data = numbers.join(',') + ']'
  const chunks = []

  // Split data into chunks, ensuring some numbers are split across boundaries
  let offset = 0
  while (offset < data.length) {
    const chunkSize = Math.floor(Math.random() * 100) + 50 // 50-150 bytes
    const chunk = new TextEncoder().encode(data.slice(offset, offset + chunkSize))
    chunks.push(chunk)
    offset += chunkSize
  }

  return chunks
}

console.log('=== NO CONCATENATION BENCHMARK ===')
console.log('This benchmark shows the performance improvement from eliminating array concatenation')

const chunks = createTestChunks()
console.log(`Generated ${chunks.length} chunks with data split across boundaries`)

// Warm up
for (let i = 0; i < 100; i++) {
  oldApproach(chunks)
  newApproach(chunks)
}

// Benchmark old approach
console.log('\n=== OLD APPROACH (1000 iterations) ===')
const oldStart = performance.now()
for (let i = 0; i < 1000; i++) {
  oldApproach(chunks)
}
const oldEnd = performance.now()
const oldTime = oldEnd - oldStart
console.log(`Total time: ${oldTime.toFixed(2)}ms`)
console.log(`Average time per iteration: ${(oldTime / 1000).toFixed(3)}ms`)

// Benchmark new approach
console.log('\n=== NEW APPROACH (1000 iterations) ===')
const newStart = performance.now()
for (let i = 0; i < 1000; i++) {
  newApproach(chunks)
}
const newEnd = performance.now()
const newTime = newEnd - newStart
console.log(`Total time: ${newTime.toFixed(2)}ms`)
console.log(`Average time per iteration: ${(newTime / 1000).toFixed(3)}ms`)

// Performance comparison
const speedup = oldTime / newTime
const improvement = ((oldTime - newTime) / oldTime) * 100
const timeSaved = oldTime - newTime

console.log('\n=== PERFORMANCE COMPARISON ===')
console.log(`Speedup: ${speedup.toFixed(2)}x faster`)
console.log(`Improvement: ${improvement.toFixed(1)}% faster`)
console.log(`Time saved: ${timeSaved.toFixed(2)}ms`)

console.log('\n=== MEMORY ALLOCATION COMPARISON ===')
console.log('Old approach: Creates new concatenated array for each chunk')
console.log('New approach: No concatenation, only state passing')
console.log('Memory allocation reduction: Significant (no array copying)')