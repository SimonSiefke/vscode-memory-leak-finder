import { test, expect } from '@jest/globals'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Create test heap snapshot files for performance analysis
const createTestSnapshot = async (path, size = 'medium') => {
  const stream = createWriteStream(path)

  // Create a realistic heap snapshot structure
  const metadata = {
    snapshot: {
      meta: {
        node_fields: ["type", "name", "id", "self_size", "edge_count", "trace_node_id"],
        node_types: [["hidden", "array", "string", "object", "code", "closure", "regexp", "number", "native", "synthetic", "concatenated string", "sliced string", "symbol", "bigint"], "string", "number", "number", "number", "number"],
        edge_fields: ["type", "name_or_index", "to_node"],
        edge_types: [["context", "element", "property", "internal", "hidden", "shortcut", "weak"], "string_or_number", "node"],
        location_fields: ["object_index", "script_id", "line", "column"]
      },
      node_count: size === 'large' ? 2000000 : 1000000,
      edge_count: size === 'large' ? 4000000 : 2000000
    }
  }

  stream.write(JSON.stringify(metadata) + '\n')

  // Write nodes array
  stream.write('"nodes":[')
  const nodeCount = metadata.snapshot.node_count
  for (let i = 0; i < nodeCount; i++) {
    if (i > 0) stream.write(',')
    stream.write(`1,"Object",${i},32,2,0`)
  }
  stream.write('],\n')

  // Write edges array
  stream.write('"edges":[')
  const edgeCount = metadata.snapshot.edge_count
  for (let i = 0; i < edgeCount; i++) {
    if (i > 0) stream.write(',')
    stream.write(`2,"prop${i % 1000}",${(i + 1) % nodeCount}`)
  }
  stream.write('],\n')

  // Write locations array
  stream.write('"locations":[')
  for (let i = 0; i < Math.min(nodeCount, 100000); i++) {
    if (i > 0) stream.write(',')
    stream.write(`${i},1,${i % 1000},0`)
  }
  stream.write('],\n')

  stream.write('"strings":["","Object","prop"]\n')
  stream.end()

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(undefined))
    stream.on('error', reject)
  })
}

test('performance analysis - identical snapshots parallel vs sequential', async () => {
  const tmpDir = tmpdir()
  const snapshot1 = join(tmpDir, 'test-snapshot-1.json')
  const snapshot2 = join(tmpDir, 'test-snapshot-2.json')

  // Create two identical test snapshots
  await createTestSnapshot(snapshot1, 'medium')
  await createTestSnapshot(snapshot2, 'medium')

  // Test sequential parsing
  console.log('\n=== SEQUENTIAL PARSING ===')
  const sequentialStart = performance.now()

  const seq1Start = performance.now()
  const result1Sequential = await prepareHeapSnapshot(snapshot1)
  const seq1End = performance.now()
  console.log(`Sequential snapshot 1: ${(seq1End - seq1Start).toFixed(2)}ms`)

  const seq2Start = performance.now()
  const result2Sequential = await prepareHeapSnapshot(snapshot2)
  const seq2End = performance.now()
  console.log(`Sequential snapshot 2: ${(seq2End - seq2Start).toFixed(2)}ms`)

  const sequentialTotal = performance.now() - sequentialStart
  console.log(`Sequential total: ${sequentialTotal.toFixed(2)}ms`)

  // Test parallel parsing
  console.log('\n=== PARALLEL PARSING ===')
  const parallelStart = performance.now()

  const [result1Parallel, result2Parallel] = await Promise.all([
    prepareHeapSnapshot(snapshot1),
    prepareHeapSnapshot(snapshot2)
  ])

  const parallelTotal = performance.now() - parallelStart
  console.log(`Parallel total: ${parallelTotal.toFixed(2)}ms`)

  // Calculate improvement
  const improvement = ((sequentialTotal - parallelTotal) / sequentialTotal) * 100
  console.log(`\n=== ANALYSIS ===`)
  console.log(`Sequential: ${sequentialTotal.toFixed(2)}ms`)
  console.log(`Parallel: ${parallelTotal.toFixed(2)}ms`)
  console.log(`Improvement: ${improvement.toFixed(1)}%`)
  console.log(`Theoretical max: 50%`)
  console.log(`Efficiency: ${(improvement / 50 * 100).toFixed(1)}% of theoretical max`)

  // Verify results are identical
  expect(result1Sequential.nodes.length).toBe(result1Parallel.nodes.length)
  expect(result2Sequential.nodes.length).toBe(result2Parallel.nodes.length)

  // Clean up
  await import('node:fs/promises').then(fs => Promise.all([
    fs.unlink(snapshot1).catch(() => {}),
    fs.unlink(snapshot2).catch(() => {})
  ]))
}, 60000) // 60 second timeout

test('system resource analysis', async () => {
  console.log('\n=== SYSTEM ANALYSIS ===')

  // Check CPU info
  const os = await import('node:os')
  console.log(`CPU cores: ${os.cpus().length}`)
  console.log(`Architecture: ${os.arch()}`)
  console.log(`Platform: ${os.platform()}`)
  console.log(`Total memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`)
  console.log(`Free memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`)

  // Check worker threads support
  const worker_threads = await import('node:worker_threads')
  console.log(`Worker threads available: ${worker_threads.isMainThread}`)

  expect(os.cpus().length).toBeGreaterThan(0)
})