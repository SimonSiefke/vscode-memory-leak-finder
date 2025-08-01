import { parentPort, workerData } from 'node:worker_threads'

const { sharedBuffer, startNode, endNode, itemsPerNode, objectShapeIndex } = workerData

// Access the shared array buffer
const nodes = new Uint32Array(sharedBuffer)

let count = 0

// Process the assigned chunk of nodes
for (let i = startNode; i < endNode; i++) {
  const nodeIndex = i * itemsPerNode
  const typeIndex = nodes[nodeIndex]

  if (typeIndex === objectShapeIndex) {
    count++
  }
}

// Send the result back to the main thread
parentPort.postMessage({ count })