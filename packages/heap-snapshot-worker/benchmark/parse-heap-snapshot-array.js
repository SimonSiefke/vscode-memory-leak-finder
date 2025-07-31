import { parseHeapSnapshotArray } from '../src/parts/ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import { readFileSync } from 'fs'

// Read the real heap snapshot file as a buffer
const heapSnapshotPath = '../../.vscode-heapsnapshots/1.json'
console.log('Reading heap snapshot from:', heapSnapshotPath)

// Read the file as a buffer for better performance
const fileBuffer = readFileSync(heapSnapshotPath)
const fileContent = fileBuffer.toString('utf8')

// Find the start of the nodes array
const nodesStart = fileContent.indexOf('"nodes":')
if (nodesStart === -1) {
  console.error('Could not find "nodes": in the heap snapshot')
  process.exit(1)
}

console.log('Found nodes array at position:', nodesStart)

// Find the opening bracket after "nodes":
const bracketStart = fileContent.indexOf('[', nodesStart)
if (bracketStart === -1) {
  console.error('Could not find opening bracket after "nodes":')
  process.exit(1)
}

// Extract a sample of the nodes array (first 100KB for testing)
const sampleStart = bracketStart + 1 // Skip the opening '['
const sampleEnd = Math.min(sampleStart + 100000, fileContent.length)
const sampleString = fileContent.substring(sampleStart, sampleEnd)

// Convert string to Uint8Array for buffer-based parsing
const sampleData = new TextEncoder().encode(sampleString)

console.log('Sample data length:', sampleData.length)
console.log('Sample data preview (first 200 chars):', sampleString.substring(0, 200))

// Count how many numbers are in the sample
let numberCount = 0
let currentNumber = ''
for (let i = 0; i < sampleString.length; i++) {
  const char = sampleString[i]
  if (char >= '0' && char <= '9') {
    currentNumber += char
  } else if (currentNumber) {
    numberCount++
    currentNumber = ''
  }
}
if (currentNumber) numberCount++

console.log('Estimated numbers in sample:', numberCount)

// Create array to store parsed numbers
const array = new Uint32Array(numberCount)

// Warm up
console.log('Warming up...')
for (let i = 0; i < 100; i++) {
  parseHeapSnapshotArray(sampleData, array, 0)
}

// Benchmark
const iterations = 1000
console.log(`Benchmarking ${iterations} iterations...`)
const start = performance.now()

let totalNumbersParsed = 0
for (let i = 0; i < iterations; i++) {
  const result = parseHeapSnapshotArray(sampleData, array, 0)
  totalNumbersParsed += result.arrayIndex
}

const end = performance.now()
const totalTime = end - start
const avgTime = totalTime / iterations
const numbersPerSecond = (totalNumbersParsed / totalTime) * 1000

console.log('\n=== REAL HEAP SNAPSHOT BENCHMARK RESULTS (BUFFER-BASED) ===')
console.log(`Sample data size: ${sampleData.length} bytes`)
console.log(`Numbers parsed per iteration: ${totalNumbersParsed / iterations}`)
console.log(`Total iterations: ${iterations}`)
console.log(`Total time: ${totalTime.toFixed(2)}ms`)
console.log(`Average time per iteration: ${avgTime.toFixed(3)}ms`)
console.log(`Numbers parsed per second: ${numbersPerSecond.toFixed(0)}`)
console.log(`Bytes processed per second: ${((sampleData.length * iterations) / totalTime * 1000).toFixed(0)}`)

// Test with different chunk sizes to simulate streaming
console.log('\n=== STREAMING SIMULATION (BUFFER-BASED) ===')
const chunkSizes = [1000, 5000, 10000, 50000]
for (const chunkSize of chunkSizes) {
  const chunks = []
  for (let i = 0; i < sampleData.length; i += chunkSize) {
    chunks.push(sampleData.subarray(i, i + chunkSize))
  }

  const streamingArray = new Uint32Array(numberCount)
  let arrayIndex = 0
  let totalStreamingTime = 0

  for (const chunk of chunks) {
    const chunkStart = performance.now()
    const result = parseHeapSnapshotArray(chunk, streamingArray, arrayIndex)
    const chunkEnd = performance.now()
    totalStreamingTime += chunkEnd - chunkStart
    arrayIndex = result.arrayIndex
  }

  console.log(`Chunk size ${chunkSize}: ${totalStreamingTime.toFixed(2)}ms for ${chunks.length} chunks`)
}