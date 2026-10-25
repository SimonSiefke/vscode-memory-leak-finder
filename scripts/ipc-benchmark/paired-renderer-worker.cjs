Buffer.poolSize = 8192
for (let i = 0; i < 256; i++) {
  if (Buffer.allocUnsafe(512).buffer.byteLength === 8192) break
}
process.parentPort.once('message', async (event) => {
  try {
    const { root, modules, asyncHandler } = event.data
    const load = (path) => import('file://' + root + '/out/' + path)
    const [{ RPCMessagePort }, { ProxyIdentifier }] = await Promise.all([
      load('vs/workbench/services/extensions/common/rpcMessagePort.js'),
      load('vs/workbench/services/extensions/common/proxyIdentifier.js'),
    ])
    const id = new ProxyIdentifier('ipc-primitive-comparison')
    for (const [i, module] of Object.values(modules).entries()) {
      const { RPCProtocol } = await load(module)
      const port = event.ports[i]
      const protocol = new RPCMessagePort((message) => port.postMessage(message))
      port.on('message', (event) => protocol.acceptMessage(event.data))
      port.start()
      const rpc = new RPCProtocol(protocol)
      rpc.set(id, { $echo: asyncHandler ? async (value) => value : (value) => value })
    }
    process.parentPort.postMessage({ ready: true, poolSize: Buffer.poolSize, node: process.version })
  } catch (error) {
    process.parentPort.postMessage({ error: String(error.stack) })
  }
})
