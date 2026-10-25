const load = (root, path) => import('file://' + root + '/out/' + path)
export async function compare({
  root,
  modules,
  ports,
  kind,
  blocks = 4,
  iterations = 512,
  samples = 3,
  concurrency = 1,
  seed = 3212511,
  asyncHandler = false,
  fixtureFilter = '.*',
  identifier: providedIdentifier,
}) {
  const [{ RPCMessagePort }, { ProxyIdentifier, SerializableObjectWithBuffers }, { VSBuffer }] = await Promise.all([
    load(root, 'vs/workbench/services/extensions/common/rpcMessagePort.js'),
    load(root, 'vs/workbench/services/extensions/common/proxyIdentifier.js'),
    load(root, 'vs/base/common/buffer.js'),
  ])
  const identifier = providedIdentifier ?? new ProxyIdentifier('ipc-primitive-comparison')
  const clients = {}
  const totals = {}
  for (const [index, [name, module]] of Object.entries(modules).entries()) {
    const { RPCProtocol } = await load(root, module)
    const port = ports[index]
    const traffic = { sent: 0, received: 0 }
    const protocol = new RPCMessagePort((message) => {
      traffic.sent++
      port.postMessage(message)
    })
    if (kind === 'renderer')
      port.onmessage = (event) => {
        traffic.received++
        protocol.acceptMessage(event.data)
      }
    else
      port.on('message', (message) => {
        traffic.received++
        protocol.acceptMessage(message)
      })
    port.start()
    const rpc = new RPCProtocol(protocol)
    clients[name] = { rpc, proxy: rpc.getProxy(identifier), port }
    totals[name] = traffic
  }
  const settings = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => ['editor.setting' + i, { enabled: true, value: i, scopes: ['user', 'workspace'] }]),
  )
  const fixtures = [
    ['primitive', 42],
    ['small-object', { command: 'open', options: { pinned: true }, ids: [1, 2, 3] }],
    ['settings-100', settings],
    ['text-4KiB', 'a'.repeat(4096)],
    ['text-64KiB', 'b'.repeat(65536)],
    ['text-escaped', '"quoted"\\path\r\n😊'.repeat(256)],
    ['wrapped-settings-100', new SerializableObjectWithBuffers(settings)],
    [
      'workspace-edits-100',
      new SerializableObjectWithBuffers({
        edits: Array.from({ length: 100 }, (_, i) => ({
          resource: { $mid: 1, scheme: 'file', path: '/workspace/file' + i },
          edit: {
            range: { startLineNumber: i + 1, startColumn: 1, endLineNumber: i + 1, endColumn: 10 },
            text: 'replacement ' + i,
            eol: undefined,
          },
          metadata: { label: 'edit ' + i, needsConfirmation: undefined },
        })),
      }),
    ],
    [
      'notebook-100',
      new SerializableObjectWithBuffers({
        cells: Array.from({ length: 100 }, (_, i) => ({
          language: 'markdown',
          source: 'cell ' + i,
          metadata: undefined,
          outputs: [{ mime: 'text/plain', data: VSBuffer.fromString('output ' + i) }],
        })),
      }),
    ],
  ]
    .map(([name, value]) => ({ name, value, expected: JSON.stringify(value) }))
    .filter((f) => new RegExp(fixtureFilter).test(f.name))
  const validate = (fixture, value) => {
    if (JSON.stringify(value) !== fixture.expected) throw new Error('Invalid reply for ' + fixture.name)
  }
  for (const fixture of fixtures)
    for (const client of Object.values(clients)) {
      let last
      for (let i = 0; i < 200; i++) last = await client.proxy.$echo(fixture.value)
      validate(fixture, last)
    }
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const shuffle = (values) => {
    const result = values.slice()
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
  const result = {
    kind,
    seed,
    modules,
    blocks: [],
    iterations,
    samples,
    concurrency,
    asyncHandler,
    hasBuffer: typeof Buffer !== 'undefined',
    warmupCallsPerFixtureVariant: 200,
  }
  for (let block = 0; block < blocks; block++) {
    const entry = { index: block, fixtures: [] }
    result.blocks.push(entry)
    for (const fixture of shuffle(fixtures)) {
      const row = { name: fixture.name, order: shuffle(Object.keys(clients)), runs: [] }
      entry.fixtures.push(row)
      for (const name of row.order) {
        const { proxy } = clients[name]
        const elapsed = []
        for (let sample = 0; sample < samples; sample++) {
          let last
          const start = performance.now()
          for (let i = 0; i < iterations; i += concurrency) {
            if (concurrency === 1) last = await proxy.$echo(fixture.value)
            else
              last = (await Promise.all(Array.from({ length: Math.min(concurrency, iterations - i) }, () => proxy.$echo(fixture.value))))[0]
          }
          elapsed.push(((performance.now() - start) * 1000) / iterations)
          validate(fixture, last)
        }
        row.runs.push({ variant: name, microsecondsPerRoundTrip: elapsed })
      }
    }
  }
  result.traffic = totals
  for (const { rpc, port } of Object.values(clients)) {
    rpc.dispose()
    port.close()
  }
  return result
}
