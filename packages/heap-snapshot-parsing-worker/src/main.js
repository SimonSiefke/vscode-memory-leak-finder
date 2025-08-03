import { parentPort } from 'node:worker_threads'
import { commandMap } from './parts/CommandMap/CommandMap.js'

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

parentPort.on('message', async (message) => {
  const { id, method, params } = message

  try {
    console.log(`[ParseWorker] Received request: ${method} (id: ${id}) with params: ${params?.[0] ? 'file path provided' : 'no params'}`)
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
    console.log(`[ParseWorker] Result data sizes:`)
    console.log(`  - nodes: ${result.nodes?.length || 0} elements (${(result.nodes?.byteLength || 0) / 1024 / 1024}MB)`)
    console.log(`  - edges: ${result.edges?.length || 0} elements (${(result.edges?.byteLength || 0) / 1024 / 1024}MB)`)
    console.log(`  - locations: ${result.locations?.length || 0} elements (${(result.locations?.byteLength || 0) / 1024 / 1024}MB)`)

    // Send the result back with transfer list for zero-copy
    const transferList = getTransferList(result)
    console.log(`[ParseWorker] Transferring ${transferList.length} ArrayBuffers with zero-copy`)

    parentPort.postMessage({ id, result }, transferList)
    const transferTime = performance.now()

    console.log(`[ParseWorker] Transfer completed in ${(transferTime - parseTime).toFixed(2)}ms`)
    console.log(`[ParseWorker] Total time: ${(transferTime - startTime).toFixed(2)}ms`)
  } catch (error) {
    console.error(`[ParseWorker] Error during parsing:`, error)
    // Send error back
    parentPort.postMessage({ id, error: error.message })
  }
})
