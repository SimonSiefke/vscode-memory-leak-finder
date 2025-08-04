import { parentPort } from 'node:worker_threads'
import { commandMap } from './parts/CommandMap/CommandMap.js'

// Ensure we're running in a worker thread context
if (!parentPort) {
  throw new Error('This script must be run in a worker thread')
}

// Create a reference that TypeScript knows is not null
const workerPort = parentPort

// Helper function to get transferrable objects for zero-copy transfer
const getTransferList = (result) => {
  const transferList = []
  if (result && typeof result === 'object') {
    if (result.nodes && result.nodes.buffer) {
      transferList.push(result.nodes.buffer)
    }
    if (result.edges && result.edges.buffer) {
      transferList.push(result.edges.buffer)
    }
    if (result.locations && result.locations.buffer) {
      transferList.push(result.locations.buffer)
    }
  }
  return transferList
}

workerPort.on('message', async (message) => {
  const messageReceiveTime = performance.now()
  const { id, method, params } = message

  try {
    console.log(`[ParseWorker] Received request: ${method} (id: ${id}) with params: ${params?.[0] ? 'file path provided' : 'no params'}`)
    console.log(`[ParseWorker] Message received at: ${messageReceiveTime.toFixed(2)}ms`)
    const startTime = performance.now()

    // Find the command handler
    const handler = commandMap[method]
    if (!handler) {
      throw new Error(`Unknown method: ${method}`)
    }

    // Execute the command
    console.log(`[ParseWorker] Starting parsing...`)
    const result = await handler(...params)
    const parseTime = performance.now()

    console.log(`[ParseWorker] Parsing completed in ${(parseTime - startTime).toFixed(2)}ms`)

    const loggingStart = performance.now()
    console.log(`[ParseWorker] Result data sizes:`)
    console.log(`  - nodes: ${result.nodes?.length || 0} elements (${(result.nodes?.byteLength || 0) / 1024 / 1024}MB)`)
    console.log(`  - edges: ${result.edges?.length || 0} elements (${(result.edges?.byteLength || 0) / 1024 / 1024}MB)`)
    console.log(`  - locations: ${result.locations?.length || 0} elements (${(result.locations?.byteLength || 0) / 1024 / 1024}MB)`)
    const loggingTime = performance.now()
    console.log(`[ParseWorker] Logging took: ${(loggingTime - loggingStart).toFixed(2)}ms`)

    // Send the result back with transfer list for zero-copy
    const transferListStart = performance.now()
    const transferList = getTransferList(result)
    const transferListTime = performance.now()
    console.log(`[ParseWorker] Transfer list creation took: ${(transferListTime - transferListStart).toFixed(2)}ms`)
    console.log(`[ParseWorker] Transferring ${transferList.length} ArrayBuffers with zero-copy`)

    const postMessageStart = performance.now()
    workerPort.postMessage({ id, result }, transferList)
    const postMessageTime = performance.now()
    console.log(`[ParseWorker] postMessage call took: ${(postMessageTime - postMessageStart).toFixed(2)}ms`)

    console.log(`[ParseWorker] Total post-parse overhead: ${(postMessageTime - parseTime).toFixed(2)}ms`)
    console.log(`[ParseWorker] Total time: ${(postMessageTime - startTime).toFixed(2)}ms`)
  } catch (error) {
    console.error(`[ParseWorker] Error during parsing:`, error)
    // Send error back
    workerPort.postMessage({ id, error: error.message })
  }
})
