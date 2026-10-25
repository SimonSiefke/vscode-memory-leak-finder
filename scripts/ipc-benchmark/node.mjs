import { Worker, MessageChannel, parentPort } from 'node:worker_threads'
import { writeFileSync } from 'node:fs'
import { compare } from './paired-engine.mjs'
const options = JSON.parse(process.env.IPC_OPT_BENCH_OPTIONS)
const load = (path) => import('file://' + options.root + '/out/' + path)
if (parentPort) {
  parentPort.once('message', async ({ ports, identifier }) => {
    try {
      const [{ RPCMessagePort }, { ProxyIdentifier }] = await Promise.all([
        load('vs/workbench/services/extensions/common/rpcMessagePort.js'),
        load('vs/workbench/services/extensions/common/proxyIdentifier.js'),
      ])
      const id = new ProxyIdentifier('ipc-primitive-comparison')
      if (id.nid !== identifier) throw new Error('Mismatched actor IDs')
      for (const [i, module] of Object.values(options.modules).entries()) {
        const { RPCProtocol } = await load(module)
        const port = ports[i]
        const protocol = new RPCMessagePort((message) => port.postMessage(message))
        port.on('message', (message) => protocol.acceptMessage(message))
        port.start()
        const rpc = new RPCProtocol(protocol)
        rpc.set(id, { $echo: options.asyncHandler ? async (value) => value : (value) => value })
      }
      parentPort.postMessage({ ready: true, node: process.version, poolSize: Buffer.poolSize })
    } catch (error) {
      parentPort.postMessage({ error: String(error.stack) })
    }
  })
} else {
  const { ProxyIdentifier } = await load('vs/workbench/services/extensions/common/proxyIdentifier.js')
  const id = new ProxyIdentifier('ipc-primitive-comparison')
  const pairs = Object.keys(options.modules).map(() => new MessageChannel())
  const worker = new Worker(new URL(import.meta.url))
  const ready = new Promise((resolve, reject) => {
    worker.once('message', (r) => (r.error ? reject(new Error(r.error)) : resolve(r)))
    worker.once('error', reject)
  })
  worker.postMessage(
    { ports: pairs.map((p) => p.port2), identifier: id.nid },
    pairs.map((p) => p.port2),
  )
  const metadata = await ready
  try {
    const startCpu = process.cpuUsage()
    const result = await compare({ ...options, kind: 'node', identifier: id, ports: pairs.map((p) => p.port1) })
    writeFileSync(
      process.env.OUTPUT,
      JSON.stringify(
        {
          ...result,
          node: process.version,
          poolSize: Buffer.poolSize,
          worker: metadata,
          processCpuMicroseconds: process.cpuUsage(startCpu),
        },
        null,
        2,
      ),
    )
  } finally {
    await worker.terminate()
  }
}
