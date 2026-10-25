export async function run(options, port, identifierNumber) {
  const load = (path) => import('file://' + options.root + '/out/' + path)
  const [{ RPCProtocol }, { RPCMessagePort }, { ProxyIdentifier }] = await Promise.all([
    load(options.module),
    load('vs/workbench/services/extensions/common/rpcMessagePort.js'),
    load('vs/workbench/services/extensions/common/proxyIdentifier.js'),
  ])
  const id = new ProxyIdentifier('instruction-benchmark')
  if (id.nid !== identifierNumber) throw new Error('Actor IDs differ')
  const protocol = new RPCMessagePort((message) => port.postMessage(message))
  port.onmessage = (event) => protocol.acceptMessage(event.data)
  port.start()
  const rpc = new RPCProtocol(protocol)
  const proxy = rpc.getProxy(id)
  const fixtures = {
    primitive: 42,
    'small-object': { command: 'open', options: { pinned: true }, ids: [1, 2, 3] },
    'settings-100': Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => ['setting' + i, { enabled: true, value: i, scopes: ['user', 'workspace'] }]),
    ),
    'text-4KiB': 'x'.repeat(4096),
    'text-64KiB': 'x'.repeat(65536),
    'text-escaped': '"quoted"\\path\r\n😊'.repeat(256),
  }
  const fixture = fixtures[options.fixture]
  if (fixture === undefined) throw new Error('Unknown fixture')
  const expected = JSON.stringify(fixture)
  const concurrency = options.concurrency || 1
  const pending = new Array(concurrency)
  let last
  const measure = async (iterations) => {
    if (iterations % concurrency) throw new Error('Partial group')
    if (concurrency === 1) {
      for (let i = 0; i < iterations; i++) last = await proxy.$echo(fixture)
    } else
      for (let i = 0; i < iterations; i += concurrency) {
        for (let j = 0; j < concurrency; j++) pending[j] = proxy.$echo(fixture)
        last = (await Promise.all(pending))[0]
      }
  }
  try {
    await measure(options.warmup || 20000)
    if (JSON.stringify(last) !== expected) throw new Error('Invalid warmup result')
    await window.benchmarkControl('gc')
    const before = await window.benchmarkControl('stats')
    await window.benchmarkControl('enable')
    const start = performance.now()
    await measure(options.iterations)
    const elapsedMs = performance.now() - start
    await window.benchmarkControl('disable')
    const after = await window.benchmarkControl('stats')
    if (JSON.stringify(last) !== expected || after.requests - before.requests !== options.iterations)
      throw new Error('Invalid measured result or request count')
    return { elapsedMs, measuredLogicalCalls: after.requests - before.requests, hasBuffer: typeof Buffer !== 'undefined' }
  } finally {
    rpc.dispose()
    port.close()
  }
}
