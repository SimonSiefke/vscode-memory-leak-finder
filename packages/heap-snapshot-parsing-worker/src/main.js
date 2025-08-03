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
    // Find the command handler
    const handler = commandMap[method]
    if (!handler) {
      throw new Error(`Unknown method: ${method}`)
    }

    // Execute the command
    const result = await handler(...params)

    // Send the result back with transfer list for zero-copy
    const transferList = getTransferList(result)
    parentPort.postMessage({ id, result }, transferList)
  } catch (error) {
    // Send error back
    parentPort.postMessage({ id, error: error.message })
  }
})
