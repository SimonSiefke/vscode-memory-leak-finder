Buffer.poolSize = 8192
for (let i = 0; i < 256; i++) {
  if (Buffer.allocUnsafe(512).buffer.byteLength === 8192) break
}
let requests = 0
process.parentPort.on('message', async (event) => {
  try {
    if (event.data.command === 'start') {
      const { root, module, handler } = event.data.options
      const load = (path) => import('file://' + root + '/out/' + path)
      const [{ RPCProtocol }, { RPCMessagePort }, { ProxyIdentifier }] = await Promise.all([
        load(module),
        load('vs/workbench/services/extensions/common/rpcMessagePort.js'),
        load('vs/workbench/services/extensions/common/proxyIdentifier.js'),
      ])
      const id = new ProxyIdentifier('instruction-benchmark')
      const port = event.ports[0]
      const protocol = new RPCMessagePort((message) => port.postMessage(message))
      port.on('message', (event) => protocol.acceptMessage(event.data))
      port.start()
      const rpc = new RPCProtocol(protocol)
      rpc.set(id, {
        $echo: (value) => {
          requests++
          return handler === 'resolved'
            ? Promise.resolve(value)
            : handler === 'deferred'
              ? new Promise((resolve) => setImmediate(() => resolve(value)))
              : value
        },
      })
      process.parentPort.postMessage({ ready: true, identifier: id.nid, node: process.version, poolSize: Buffer.poolSize })
    } else if (event.data.command === 'gc') {
      const { Session } = require('node:inspector/promises')
      const session = new Session()
      session.connect()
      try {
        await session.post('HeapProfiler.collectGarbage')
      } finally {
        session.disconnect()
      }
      process.parentPort.postMessage({ collected: true })
    } else if (event.data.command === 'stats') {
      process.parentPort.postMessage({ requests })
    }
  } catch (error) {
    process.parentPort.postMessage({ error: String(error.stack) })
  }
})
