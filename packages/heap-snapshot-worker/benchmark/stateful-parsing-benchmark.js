import { performance } from 'perf_hooks'
import { parseHeapSnapshotArray } from '../src/parts/ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

// Simulate the old approach (concatenating arrays)
const oldApproach = (chunks, array) => {
  let arrayIndex = 0
  let concatenatedData = new Uint8Array(0)

  for (const chunk of chunks) {
    concatenatedData = new Uint8Array([...concatenatedData, ...chunk])
    const result = parseHeapSnapshotArray(concatenatedData, array, arrayIndex)
    arrayIndex = result.arrayIndex
    concatenatedData = concatenatedData.slice(result.dataIndex)
  }

  return arrayIndex
}

// Simulate the new stateful approach
const newApproach = (chunks, array) => {
  let arrayIndex = 0
  let currentNumber = 0
  let hasDigits = false

    for (const chunk of chunks) {
    const result = parseHeapSnapshotArray(chunk, array, arrayIndex, currentNumber, hasDigits)
    arrayIndex = result.arrayIndex
    currentNumber = result.currentNumber
    hasDigits = result.hasDigits
  }

  return arrayIndex
}

// Generate test data that simulates real heap snapshot parsing
const generateTestData = () => {
  const chunks = []
  const numbers = []
  let currentNumber = 1

  // Create chunks with partial numbers at boundaries
  for (let i = 0; i < 100; i++) {
    let chunk = ''

    // Add some complete numbers
    for (let j = 0; j < 5; j++) {
      chunk += `${currentNumber},`
      numbers.push(currentNumber)
      currentNumber++
    }

    // Add a partial number at the end
    const partialNumber = currentNumber.toString()
    chunk += partialNumber.substring(0, 2) // Only first 2 digits
    chunks.push(new TextEncoder().encode(chunk))

    // Next chunk starts with remaining digits
    const remainingDigits = partialNumber.substring(2)
    if (remainingDigits) {
      chunks.push(new TextEncoder().encode(remainingDigits + ','))
    }

    currentNumber++
  }

  // Add closing bracket
  chunks.push(new TextEncoder().encode(']'))

  return { chunks, numbers }
}

// Benchmark old approach
const benchmarkOldApproach = (iterations) => {
  const { chunks, numbers } = generateTestData()

  console.log(`\n=== OLD APPROACH (${iterations} iterations) ===`)
  console.log(`Chunks: ${chunks.length}`)
  console.log(`Expected numbers: ${numbers.length}`)

  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    const array = new Uint32Array(numbers.length + 100) // Extra space for safety
    const result = oldApproach(chunks, array)
  }

  const end = performance.now()
  const totalTime = end - start
  const avgTime = totalTime / iterations

  console.log(`Total time: ${totalTime.toFixed(2)}ms`)
  console.log(`Average time per iteration: ${avgTime.toFixed(3)}ms`)

  return { totalTime, avgTime }
}

// Benchmark new approach
const benchmarkNewApproach = (iterations) => {
  const { chunks, numbers } = generateTestData()

  console.log(`\n=== NEW APPROACH (${iterations} iterations) ===`)
  console.log(`Chunks: ${chunks.length}`)
  console.log(`Expected numbers: ${numbers.length}`)

  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    const array = new Uint32Array(numbers.length + 100) // Extra space for safety
    const result = newApproach(chunks, array)
  }

  const end = performance.now()
  const totalTime = end - start
  const avgTime = totalTime / iterations

  console.log(`Total time: ${totalTime.toFixed(2)}ms`)
  console.log(`Average time per iteration: ${avgTime.toFixed(3)}ms`)

  return { totalTime, avgTime }
}

// Run benchmarks
console.log('=== STATEFUL PARSING BENCHMARK ===')
console.log('This benchmark compares concatenation vs stateful parsing for chunked data')

const iterations = 1000

const oldResult = benchmarkOldApproach(iterations)
const newResult = benchmarkNewApproach(iterations)

// Calculate improvement
const improvement = ((oldResult.totalTime - newResult.totalTime) / oldResult.totalTime) * 100
const speedup = oldResult.totalTime / newResult.totalTime

console.log(`\n=== PERFORMANCE COMPARISON ===`)
console.log(`Speedup: ${speedup.toFixed(2)}x faster`)
console.log(`Improvement: ${improvement.toFixed(1)}% faster`)
console.log(`Time saved: ${(oldResult.totalTime - newResult.totalTime).toFixed(2)}ms`)

// Memory allocation comparison
console.log(`\n=== MEMORY ALLOCATION COMPARISON ===`)
console.log(`Old approach: Creates new concatenated array for each chunk`)
console.log(`New approach: No concatenation, only state passing`)
console.log(`Memory allocation reduction: Significant (no array copying)`)