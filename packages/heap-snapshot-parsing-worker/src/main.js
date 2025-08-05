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
  const { id, method, params } = message
  try {
    const handler = commandMap[method]
    if (!handler) {
      throw new Error(`Unknown method: ${method}`)
    }
    const result = await handler(...params)
    const transferList = getTransferList(result)
    workerPort.postMessage({ id, result }, transferList)
  } catch (error) {
    workerPort.postMessage({ id, error: error.message })
  }
})
