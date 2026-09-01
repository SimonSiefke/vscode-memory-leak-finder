#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import {
  createProcessTreeSampler,
  getProcessTable,
  updateTrackedProcesses,
} from '../src/parts/LinuxProcessTreeResources/LinuxProcessTreeResources.ts'

const rootPid = Number(process.argv[2])
const outputPath = process.argv[3]

if (!Number.isFinite(rootPid) || !outputPath) {
  throw new Error('Usage: linux-process-tree-sampler.js <root-pid> <output-path>')
}

let resolveStop
const stopPromise = new Promise((resolve) => {
  resolveStop = resolve
})

process.once('SIGINT', resolveStop)
process.once('SIGTERM', resolveStop)

const sampler = createProcessTreeSampler(rootPid, {}, { excludeRoot: true })

try {
  const waitStart = Date.now()
  while (true) {
    const tracked = updateTrackedProcesses(rootPid, new Map(), await getProcessTable())
    if ([...tracked.keys()].some((pid) => pid !== rootPid)) {
      break
    }
    if (Date.now() - waitStart > 10_000) {
      throw new Error(`Timed out waiting for a workload below perf PID ${rootPid}`)
    }
    await setTimeout(25)
  }
  await sampler.start()
  await stopPromise
  const result = await sampler.stop()
  await writeFile(outputPath, JSON.stringify(result))
} catch (error) {
  const message = error instanceof Error ? error.message : `${error}`
  await writeFile(outputPath, JSON.stringify({ error: message }))
  process.exitCode = 1
}
