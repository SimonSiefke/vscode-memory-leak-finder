import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const root = process.env.IPC_BENCHMARK_ROOT
const productRoot = process.env.IPC_PRODUCT_ROOT
if (!root || !productRoot) throw new Error('Missing benchmark paths')
const variants = {
  buffer: `${productRoot}/buffer`,
  before: `${productRoot}/before`,
  after: `${productRoot}/after`,
}
const require = createRequire(`${variants.after}/package.json`)
const { _electron } = require('@playwright/test')
const samples = Number(process.env.IPC_STARTUP_SAMPLES ?? 100)
const selected = process.argv[3] ? [process.argv[3]] : Object.keys(variants)
const evidence = `${root}/startup`
await fs.mkdir(evidence, { recursive: true })
const manifest = Object.fromEntries(
  await Promise.all(
    Object.entries(variants).map(async ([name, product]) => [
      name,
      {
        path: product,
        sha: JSON.parse(await fs.readFile(`${product}/ipc-build.json`, 'utf8')).sha,
      },
    ]),
  ),
)
await fs.writeFile(
  `${evidence}/manifest.json`,
  JSON.stringify(
    {
      manifest,
      samples,
      node: process.version,
      methodology:
        'Three warmups per variant, then deterministic alternating permutations; persistent private profile per variant; extensions disabled; identical generated-output timer instrumentation; main-process start to ITimerService ready.',
    },
    null,
    2,
  ),
)

const backups = new Map()

async function closeApplication(app) {
  let timeout
  const closed = await Promise.race([
    app.close().then(() => true),
    new Promise((resolve) => {
      timeout = setTimeout(() => resolve(false), 30000)
    }),
  ]).finally(() => clearTimeout(timeout))
  if (!closed) {
    const pid = app.process().pid
    execFileSync('python3', [
      '-c',
      `import os, signal, sys
from pathlib import Path
children = {}
for entry in Path('/proc').iterdir():
 if entry.name.isdigit():
  try:
   stat = (entry / 'stat').read_text()
   parent = int(stat[stat.rfind(')') + 2:].split()[1])
   children.setdefault(parent, []).append(int(entry.name))
  except (OSError, ValueError): pass
def stop(pid):
 for child in children.get(pid, []): stop(child)
 try: os.kill(pid, signal.SIGKILL)
 except ProcessLookupError: pass
stop(int(sys.argv[1]))`,
      String(pid),
    ])
  }
  return !closed
}

async function validateLogs(profile) {
  const logRoot = `${profile}/logs`
  const directories = (await fs.readdir(logRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const latest = directories.at(-1)
  if (!latest) throw new Error(`Missing product logs: ${profile}`)
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(filename)
      } else if (entry.name.endsWith('.log')) {
        const text = await fs.readFile(filename, 'utf8')
        if (/Cannot find module|Cannot find package|NODE_MODULE_VERSION|Activating extension .*failed/.test(text)) {
          throw new Error(`Native/module setup error invalidates measurement: ${filename}`)
        }
      }
    }
  }
  await visit(`${logRoot}/${latest}`)
}

try {
  for (const name of selected) {
    const timer = `${variants[name]}/out/vs/workbench/services/timer/browser/timerService.js`
    let original = await fs.readFile(timer, 'utf8')
    if (original.includes('__ipcBenchmarkStartup')) {
      const provenance = JSON.parse(await fs.readFile(`${evidence}/${name}-timer-source.json`, 'utf8'))
      if (provenance.sha !== manifest[name].sha) throw new Error(`Interrupted instrumentation belongs to another revision: ${name}`)
      original = await fs.readFile(`${evidence}/${name}-timer-original.js`, 'utf8')
    }
    const needle = 'this._barrier.open();'
    if (original.split(needle).length !== 2 || original.includes('__ipcBenchmarkStartup')) {
      throw new Error(`Unexpected timer instrumentation state: ${timer}`)
    }
    backups.set(timer, original)
    const instrumentation = `globalThis.__ipcBenchmarkStartup = { mainToTimerReady: performance.timeOrigin + performance.now() - this.getStartTime('code/didStartMain'), elapsed: metrics.ellapsed, mainStart: this.getStartTime('code/didStartMain'), readyAt: performance.timeOrigin + performance.now() };`
    await fs.writeFile(`${evidence}/${name}-timer-original.js`, original)
    await fs.writeFile(`${evidence}/${name}-timer-source.json`, JSON.stringify(manifest[name]))
    await fs.writeFile(timer, original.replace(needle, `${needle}\n${instrumentation}`))
    const profile = `${evidence}/profile-${name}`
    await fs.mkdir(`${profile}/User`, { recursive: true })
    await fs.writeFile(
      `${profile}/User/settings.json`,
      JSON.stringify({
        'workbench.startupEditor': 'none',
        'telemetry.telemetryLevel': 'off',
        'extensions.autoUpdate': false,
        'extensions.autoCheckUpdates': false,
        'update.mode': 'none',
        'security.workspace.trust.enabled': false,
      }),
    )
  }

  const permutations = [
    ['buffer', 'before', 'after'],
    ['after', 'before', 'buffer'],
    ['before', 'buffer', 'after'],
    ['after', 'buffer', 'before'],
    ['buffer', 'after', 'before'],
    ['before', 'after', 'buffer'],
  ]
  for (let index = -3; index < samples; index++) {
    const order = selected.length === 1 ? selected : permutations[(index + 6 + Number(process.env.IPC_REPLICA ?? 1)) % permutations.length]
    for (const name of order) {
      const filename = `${evidence}/${name}-${String(index).padStart(4, '0')}.json`
      try {
        await fs.access(filename)
        continue
      } catch {}
      const start = performance.now()
      let app
      try {
        app = await _electron.launch({
          executablePath: `${variants[name]}/.build/electron/code-oss`,
          cwd: variants[name],
          args: [
            variants[name],
            '--no-sandbox',
            '--force-disable-user-env',
            '--disable-updates',
            '--skip-welcome',
            '--skip-release-notes',
            '--disable-workspace-trust',
            '--disable-extensions',
            '--disable-extension=GitHub.copilot',
            '--disable-extension=GitHub.copilot-chat',
            '--disable-dev-shm-usage',
            '--ozone-platform=x11',
            `--extensions-dir=${evidence}/extensions`,
            `--user-data-dir=${evidence}/profile-${name}`,
          ],
          env: { ...process.env, VSCODE_DEV: '1', VSCODE_CLI: '1', NODE_ENV: 'development' },
          timeout: 60000,
        })
        const page = await app.firstWindow({ timeout: 60000 })
        await page.waitForFunction(() => globalThis.__ipcBenchmarkStartup, undefined, { timeout: 60000 })
        const metrics = await page.evaluate(() => globalThis.__ipcBenchmarkStartup)
        if (!(metrics.mainStart > 0 && metrics.mainToTimerReady > 0 && metrics.mainToTimerReady < 60000 && metrics.elapsed > 0)) {
          throw new Error(`Invalid startup measurement: ${JSON.stringify(metrics)}`)
        }
        const wallClockDuration = performance.now() - start
        const shutdownForced = await closeApplication(app)
        app = undefined
        await validateLogs(`${evidence}/profile-${name}`)
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              variant: name,
              index,
              warmup: index < 0,
              ...manifest[name],
              startedAt: new Date().toISOString(),
              ...metrics,
              wallClockDuration,
              shutdownForced,
            },
            null,
            2,
          ),
        )
        console.log(
          JSON.stringify({ variant: name, index, mainToTimerReady: metrics.mainToTimerReady, elapsed: metrics.elapsed, shutdownForced }),
        )
      } finally {
        if (app) await closeApplication(app)
      }
    }
  }
} finally {
  for (const [timer, original] of backups) await fs.writeFile(timer, original)
}
