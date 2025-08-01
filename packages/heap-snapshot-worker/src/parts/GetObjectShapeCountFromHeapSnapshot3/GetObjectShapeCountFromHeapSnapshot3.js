import { createReadStream } from 'node:fs'
import { Worker } from 'node:worker_threads'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ITEMS_PER_NODE = 7

/**
 * @param {string} path
 * @param {number} numWorkers
 * @returns {Promise<number>}
 */
export const getObjectShapeCountFromHeapSnapshot3 = async (path, numWorkers = 8) => {
  const readStream = createReadStream(path)
  const { metaData, nodes } = await prepareHeapSnapshot(readStream)

  const { node_types } = metaData.data.meta
  const objectShapeIndex = node_types[0].indexOf('object shape')

  // Create SharedArrayBuffer for the nodes data
  const sharedBuffer = new SharedArrayBuffer(nodes.buffer.byteLength)
  const sharedNodes = new Uint32Array(sharedBuffer)
  sharedNodes.set(nodes)

  // Calculate chunk size for each worker
  const totalNodes = Math.floor(nodes.length / ITEMS_PER_NODE)
  const chunkSize = Math.ceil(totalNodes / numWorkers)

  // Create workers to process chunks in parallel
  const workerPromises = []

  for (let i = 0; i < numWorkers; i++) {
    const startNode = i * chunkSize
    const endNode = Math.min((i + 1) * chunkSize, totalNodes)

    if (startNode >= totalNodes) break

    const workerPromise = new Promise((resolve, reject) => {
      const worker = new Worker(join(__dirname, 'worker.js'), {
        workerData: {
          sharedBuffer,
          startNode,
          endNode,
          itemsPerNode: ITEMS_PER_NODE,
          objectShapeIndex
        }
      })

      worker.on('message', (result) => {
        resolve(result.count)
      })

      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
    })

    workerPromises.push(workerPromise)
  }

  // Wait for all workers to complete and sum their results
  const results = await Promise.all(workerPromises)
  const totalCount = results.reduce((sum, count) => sum + count, 0)

  return totalCount
}