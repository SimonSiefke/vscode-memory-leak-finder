import { parentPort } from 'node:worker_threads'
import { commandMap } from './parts/CommandMap/CommandMap.ts'

// Ensure we're running in a worker thread context
if (!parentPort) {
  throw new Error('This script must be run in a worker thread')
}

// Create a reference that TypeScript knows is not null
const workerPort = parentPort

// Helper function to get transferrable objects for zero-copy transfer
const getTransferList = (result: unknown): ArrayBuffer[] => {
  const transferList: ArrayBuffer[] = []
  if (result && typeof result === 'object' && result !== null) {
    const r = result as Record<string, unknown>
    if (r.nodes && typeof r.nodes === 'object' && r.nodes !== null && 'buffer' in r.nodes) {
      transferList.push((r.nodes as { buffer: ArrayBuffer }).buffer)
    }
    if (r.edges && typeof r.edges === 'object' && r.edges !== null && 'buffer' in r.edges) {
      transferList.push((r.edges as { buffer: ArrayBuffer }).buffer)
    }
    if (r.locations && typeof r.locations === 'object' && r.locations !== null && 'buffer' in r.locations) {
      transferList.push((r.locations as { buffer: ArrayBuffer }).buffer)
    }
  }
  return transferList
}

workerPort.on('message', async (message: { id: unknown; method: string; params: unknown[] }) => {
  const { id, method, params } = message
  try {
    const handler = commandMap[method as keyof typeof commandMap]
    if (!handler) {
      throw new Error(`Unknown method: ${method}`)
    }
    const result = await (handler as (...args: unknown[]) => Promise<unknown>)(...params)
    const transferList = getTransferList(result)
    workerPort.postMessage({ id, result }, transferList)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    workerPort.postMessage({ error: errorMessage, id })
  }
})
