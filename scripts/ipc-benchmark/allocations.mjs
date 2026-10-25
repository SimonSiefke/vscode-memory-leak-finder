import { MessageChannel } from 'node:worker_threads'
import { Session } from 'node:inspector/promises'
import { writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const options = JSON.parse(process.env.IPC_OPT_BENCH_OPTIONS)
const load = (path) => import('file://' + options.root + '/out/' + path)
const [{ RPCProtocol }, { RPCMessagePort }, { ProxyIdentifier }, lifecycle] = await Promise.all([
  load(options.module),
  load(options.portModule || 'vs/workbench/services/extensions/common/rpcMessagePort.js'),
  load('vs/workbench/services/extensions/common/proxyIdentifier.js'),
  load('vs/base/common/lifecycle.js'),
])
const pair = new MessageChannel()
const traffic = { packets: 0, frames: 0, jsonCharacters: 0, backingBytes: 0 }
const peers = [pair.port1, pair.port2].map((port) => {
  const protocol = new RPCMessagePort((message) => {
    traffic.packets++
    if (ArrayBuffer.isView(message)) traffic.backingBytes += message.buffer.byteLength
    else
      for (const frame of Array.isArray(message) ? message : [message]) {
        traffic.frames++
        if (typeof frame.body === 'string') traffic.jsonCharacters += frame.body.length
      }
    port.postMessage(message)
  })
  port.on('message', (message) => protocol.acceptMessage(message))
  port.start()
  return new RPCProtocol(protocol)
})
const id = new ProxyIdentifier('allocation-benchmark')
peers[1].set(id, { $echo: (value) => value })
const proxy = peers[0].getProxy(id)
const fixtures = {
  primitive: 42,
  'small-object': { command: 'open', options: { pinned: true }, ids: [1, 2, 3] },
  'text-64KiB': 'x'.repeat(65536),
  'text-escaped': '"quoted"\\path\r\n😊'.repeat(256),
}
if (!Object.hasOwn(fixtures, options.fixture)) throw new Error('Unknown allocation fixture')
const fixture = fixtures[options.fixture]
const samplingInterval = options.samplingInterval || 1024
for (let i = 0; i < 1000; i++) await proxy.$echo(fixture)
const constructors = {}
lifecycle.setDisposableTracker({
  trackDisposable: (value) => {
    const name = value.constructor.name
    constructors[name] = (constructors[name] || 0) + 1
  },
  setParent() {},
  markAsDisposed() {},
  markAsSingleton() {},
})
const inspector = new Session()
inspector.connect()
await inspector.post('HeapProfiler.enable')
await inspector.post('HeapProfiler.startSampling', {
  samplingInterval,
  includeObjectsCollectedByMajorGC: true,
  includeObjectsCollectedByMinorGC: true,
})
for (const key of Object.keys(traffic)) traffic[key] = 0
let last
try {
  for (let i = 0; i < options.iterations; i++) last = await proxy.$echo(fixture)
  assert.deepStrictEqual(last, fixture)
  const { profile } = await inspector.post('HeapProfiler.stopSampling')
  const byFunction = Object.create(null)
  let sampledBytes = 0
  const walk = (node) => {
    sampledBytes += node.selfSize
    const name = node.callFrame.functionName || '(anonymous)'
    byFunction[name] = (byFunction[name] || 0) + node.selfSize
    for (const child of node.children) walk(child)
  }
  walk(profile.head)
  writeFileSync(
    process.env.OUTPUT,
    JSON.stringify(
      {
        node: process.version,
        poolSize: Buffer.poolSize,
        options,
        diagnosticOnly: true,
        includesCollectedObjects: true,
        samplingInterval,
        sampledBytes,
        sampledBytesPerCall: sampledBytes / options.iterations,
        trackedDisposableConstructions: constructors,
        traffic,
        byFunction,
        profile,
      },
      null,
      2,
    ),
  )
} finally {
  lifecycle.setDisposableTracker(null)
  inspector.disconnect()
  for (const peer of peers) peer.dispose()
  pair.port1.close()
  pair.port2.close()
}
