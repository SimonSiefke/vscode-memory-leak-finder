import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir, readdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const p = await mkdtemp(join(tmpdir(), 'vscode-perf-cleanup-'))
const source = await readFile(
  process.env.IPC_RUNNER_SOURCE || new URL('../../packages/large-benchmark/src/parts/Runner/Runner.ts', import.meta.url),
  'utf8',
)
const begin = source.indexOf('  const finish = async (): Promise<void> => {')
const end = source.indexOf('\n  const dispose = ', begin)
assert.ok(begin >= 0 && end > begin)
const closure = source.slice(begin, end)
const body = closure.slice(closure.indexOf('{') + 1, closure.lastIndexOf('}')).replaceAll('new Promise<void>', 'new Promise')
const output = p + '/startup-perf-cleanup-probe-' + Date.now()
await mkdir(output)
const child = spawn('perf', ['stat', '-e', 'task-clock', '-x', ';', '-o', output + '/perf.csv', '--', 'sleep', '60'], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, LC_ALL: 'C' },
})
let perfLog = ''
child.stderr.on('data', (data) => (perfLog += data))
let stopped = false,
  watcher
const stat = async (pid) => {
  const raw = await readFile(`/proc/${pid}/stat`, 'utf8')
  const fields = raw
    .slice(raw.lastIndexOf(')') + 2)
    .trim()
    .split(/\s+/)
  return { pid, identity: `${pid}:${fields[19]}`, ppid: Number(fields[1]) }
}
const tree = async (root) => {
  const rows = []
  for (const name of await readdir('/proc'))
    if (/^\d+$/.test(name))
      try {
        rows.push(await stat(Number(name)))
      } catch {}
  const result = []
  const ids = new Set([root])
  let changed = true
  while (changed) {
    changed = false
    for (const row of rows)
      if (ids.has(row.pid) || ids.has(row.ppid)) {
        if (!result.some((r) => r.pid === row.pid)) {
          result.push(row)
          if (!ids.has(row.pid)) {
            ids.add(row.pid)
            changed = true
          }
        }
      }
  }
  return result
}
let rootIdentity
function terminateOwnedCollector() {
  try {
    const raw = readFileSync(`/proc/${child.pid}/stat`, 'utf8')
    const fields = raw
      .slice(raw.lastIndexOf(')') + 2)
      .trim()
      .split(/\s+/)
    if (rootIdentity === `${child.pid}:${fields[19]}`) {
      process.kill(child.pid, 'SIGCONT')
      process.kill(-child.pid, 'SIGKILL')
    }
  } catch {}
}
process.once('SIGTERM', () => {
  terminateOwnedCollector()
  process.exit(143)
})
process.once('SIGINT', () => {
  terminateOwnedCollector()
  process.exit(130)
})
const watchdog = setTimeout(async () => {
  try {
    if (rootIdentity && (await stat(child.pid)).identity === rootIdentity) {
      process.kill(child.pid, 'SIGCONT')
      process.kill(-child.pid, 'SIGKILL')
    }
  } catch {}
  await writeFile(output + '/error.json', JSON.stringify({ error: 'Bounded15s cleanup probe deadline' }))
  process.exit(124)
}, 15000)
try {
  rootIdentity = (await stat(child.pid)).identity
  let descendants = []
  for (let i = 0; i < 100; i++) {
    descendants = (await tree(child.pid)).filter((r) => r.pid !== child.pid)
    if (descendants.length) break
    if (child.exitCode !== null) throw new Error('perf unavailable: ' + perfLog)
    await delay(20)
  }
  assert.equal(descendants.length, 1, 'Expected one owned sleep child')
  rootIdentity = (await stat(child.pid)).identity
  process.kill(child.pid, 'SIGSTOP')
  stopped = true
  // Hold the collector's final write until100ms after the application child dies.
  // This deterministically models the rare scheduler/flush race in forced shutdown.
  let cancel = false
  watcher = (async () => {
    while (!cancel) {
      try {
        const data = await readFile(`/proc/${descendants[0].pid}/stat`, 'utf8')
        const state = data.slice(data.lastIndexOf(')') + 2).split(' ')[0]
        if (state === 'Z') break
      } catch {
        break
      }
      await delay(10)
    }
    if (!cancel) {
      await delay(100)
      try {
        process.kill(child.pid, 'SIGCONT')
      } catch {}
    }
  })()
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const finish = new AsyncFunction(
    'child',
    'processTree',
    'evaluate',
    'main',
    'mainConnection',
    'renderer',
    'writeFile',
    'join',
    'directory',
    'log',
    'readFile',
    'delay',
    'perf',
    'electronExpression',
    body,
  )
  await finish(
    child,
    tree,
    async () => {},
    async () => {},
    undefined,
    undefined,
    writeFile,
    join,
    output,
    '',
    readFile,
    delay,
    { child },
    (expression) => expression,
  )
  cancel = true
  await watcher
  const counts = await readFile(output + '/perf.csv', 'utf8')
  const result = {
    diagnosticOnly: true,
    sourceSHA256: createHash('sha256').update(source).digest('hex'),
    closureSHA256: createHash('sha256').update(closure).digest('hex'),
    reproducerSHA256: createHash('sha256')
      .update(readFileSync(new URL(import.meta.url)))
      .digest('hex'),
    source:
      'Exact Runner.finish closure, type-only Promise<void> erased; real owned perf/sleep process group; slow application quit stubbed, actual forced cleanup and identity checks retained.',
    output,
    collectorExitCode: child.exitCode,
    collectorSignal: child.signalCode,
    containsTaskClock: counts.includes('task-clock'),
    counterFileBytes: Buffer.byteLength(counts),
    perfLog,
  }
  await writeFile(output + '/result.json', JSON.stringify(result, null, 2))
  await writeFile(p + '/startup-perf-cleanup-probe-latest.json', JSON.stringify(result, null, 2))
  assert.ok(result.containsTaskClock, 'Forced application cleanup killed the perf collector before it could flush task-clock output')
  console.log('Forced-shutdown perf flush regression passes; evidence:', output + '/result.json')
} finally {
  clearTimeout(watchdog)
  try {
    if (rootIdentity && (await stat(child.pid)).identity === rootIdentity) {
      if (stopped) process.kill(child.pid, 'SIGCONT')
      process.kill(-child.pid, 'SIGKILL')
    }
  } catch {}
  await writeFile(output + '/perf.log', perfLog)
}
