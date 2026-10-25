const vscode = require('vscode')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { Session } = require('node:inspector/promises')
const path = require('node:path')

exports.activate = (context) => {
  const options = JSON.parse(process.env.IPC_PRODUCT_BENCH_OPTIONS)
  let disposed = false
  context.subscriptions.push(
    new vscode.Disposable(() => {
      disposed = true
    }),
  )
  const run = async () => {
    for (const count of [options.iterations, options.warmup, options.concurrency]) {
      assert.ok(Number.isSafeInteger(count) && count > 0)
    }
    assert.equal(options.iterations % options.concurrency, 0)
    assert.equal(options.warmup % options.concurrency, 0)
    assert.ok(['context-unchanged', 'context-changing', 'clipboard-64KiB'].includes(options.fixture))
    const text = 'ipc-performance-text'.repeat(3450).slice(0, 65536)
    if (options.fixture === 'clipboard-64KiB') await vscode.env.clipboard.writeText(text)
    const key = 'ipc.performance.fixture'
    const call = async (index) => {
      assert.equal(disposed, false, 'Fixture disposed before completing work')
      if (options.fixture === 'clipboard-64KiB') {
        const result = await vscode.env.clipboard.readText()
        assert.equal(result, text)
      } else {
        const value = options.fixture === 'context-changing' ? index & 1 : 42
        const result = await vscode.commands.executeCommand('setContext', key, value)
        assert.equal(result, undefined)
      }
    }
    const work = async (iterations) => {
      let completed = 0
      for (let i = 0; i < iterations; i += options.concurrency) {
        const pending = []
        for (let j = 0; j < options.concurrency; j++) pending.push(call(i + j))
        await Promise.all(pending)
        completed += pending.length
      }
      assert.equal(completed, iterations)
      return completed
    }
    await work(options.warmup)
    const inspector = new Session()
    inspector.connect()
    try {
      await inspector.post('HeapProfiler.collectGarbage')
    } finally {
      inspector.disconnect()
    }
    let profile
    if (options.cpuProfile) {
      profile = new Session()
      profile.connect()
      await profile.post('Profiler.enable')
      await profile.post('Profiler.start')
    }
    const control = fs.openSync(process.env.PERF_CONTROL, 'w')
    const ack = fs.openSync(process.env.PERF_ACK, 'r')
    const buffer = Buffer.alloc(5)
    const gate = (command) => {
      fs.writeSync(control, command + '\n')
      let length = 0
      while (length < 5) {
        const count = fs.readSync(ack, buffer, length, 5 - length, null)
        if (!count) throw new Error('Perf acknowledgement closed')
        length += count
      }
      assert.equal(buffer.toString(), 'ack\n\0')
    }
    let enabled = false
    try {
      gate('enable')
      enabled = true
      const start = performance.now()
      const measuredLogicalCalls = await work(options.iterations)
      const elapsedMs = performance.now() - start
      gate('disable')
      enabled = false
      if (profile) {
        const result = await profile.post('Profiler.stop')
        fs.writeFileSync(path.join(options.outputDirectory, 'extension-host.cpuprofile'), JSON.stringify(result.profile))
        profile.disconnect()
        profile = undefined
      }
      fs.writeFileSync(
        path.join(options.outputDirectory, 'result.json'),
        JSON.stringify(
          {
            options,
            measuredLogicalCalls,
            elapsedMs,
            pid: process.pid,
            ppid: process.ppid,
            node: process.version,
            vscodeVersion: vscode.version,
            appName: vscode.env.appName,
            bufferPool: Buffer.poolSize,
            coverage:
              'Whole application process tree during completed extension API calls; includes real handlers and background work. Only extension-host GC is forced. This is distinct from isolated RPC cost.',
          },
          null,
          2,
        ),
      )
    } finally {
      if (enabled) gate('disable')
      if (profile) profile.disconnect()
      fs.closeSync(control)
      fs.closeSync(ack)
    }
    if (options.fixture !== 'clipboard-64KiB') await vscode.commands.executeCommand('setContext', key, undefined)
    void vscode.commands.executeCommand('workbench.action.closeWindow').catch(() => {})
  }
  // Finish extension activation before warming the actual application API path.
  setTimeout(() => {
    void run().catch((error) => {
      fs.writeFileSync(path.join(options.outputDirectory, 'error.json'), JSON.stringify({ error: String(error.stack) }))
      void vscode.commands.executeCommand('workbench.action.closeWindow').catch(() => {})
    })
  }, options.settleMs ?? 5000)
}
