import { Worker, isMainThread, parentPort } from 'node:worker_threads'
import { readSync, writeSync, openSync, writeFileSync, closeSync } from 'node:fs'
if (!isMainThread) {
  parentPort.on('message', (iterations) => {
    let value = 1
    for (let i = 0; i < iterations; i++) value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    parentPort.postMessage(value)
  })
  parentPort.postMessage('ready')
} else {
  const worker = new Worker(new URL(import.meta.url))
  const ready = new Promise((resolve) => worker.once('message', resolve))
  await ready
  const run = (iterations) =>
    new Promise((resolve) => {
      worker.once('message', resolve)
      worker.postMessage(iterations)
    })
  await run(1000000)
  const ctl = openSync(process.env.PERF_CONTROL, 'w')
  const ack = openSync(process.env.PERF_ACK, 'r')
  const buffer = Buffer.alloc(5)
  const gate = (command) => {
    writeSync(ctl, command + '\n')
    let length = 0
    while (length < 5) length += readSync(ack, buffer, length, 5 - length, null)
  }
  try {
    gate('enable')
    const checksum = await run(Number(process.env.COVERAGE_ITERATIONS))
    gate('disable')
    writeFileSync(
      process.env.OUTPUT,
      JSON.stringify({
        iterations: Number(process.env.COVERAGE_ITERATIONS),
        checksum,
        work: 'All measured arithmetic executes in a worker thread; the parent awaits its response',
      }),
    )
  } finally {
    closeSync(ctl)
    closeSync(ack)
    await worker.terminate()
  }
}
