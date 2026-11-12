import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { cpus, release } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { Inspector } from './Inspector.ts'

export const processes = ['main', 'renderer', 'shared-process', 'extension-host'] as const
const freePort = async (): Promise<number> => {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No inspector port')
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return address.port
}
const writeJson = (path: string, value: unknown) => writeFile(path, JSON.stringify(value, null, 2) + '\n')

export const collectStartupProfiles = async (executable: string, output: string, samples = 7): Promise<void> => {
  if (process.platform !== 'linux') throw new Error('Startup collection currently requires Linux (use xvfb-run in headless environments)')
  if (!Number.isInteger(samples) || samples < 1 || samples > 100) throw new Error('samples must be an integer from 1 to 100')
  output = resolve(output)
  // Refuse to mix different experiments or overwrite their evidence.
  await mkdir(dirname(output), { recursive: true })
  await mkdir(output, { recursive: false })
  const packageInfo = JSON.parse(await readFile(join(dirname(resolve(executable)), 'resources', 'app', 'package.json'), 'utf8'))
  const product = JSON.parse(await readFile(join(dirname(resolve(executable)), 'resources', 'app', 'product.json'), 'utf8'))
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    samples,
    environment: { platform: process.platform, architecture: process.arch, os: release(), cpu: cpus()[0]?.model, node: process.version },
    executable: resolve(executable),
    version: `${product.nameShort} ${packageInfo.version || ''} (${product.commit || 'unknown commit'})`,
    workload: 'Empty window; built-in extensions enabled; fresh user data and empty external extensions directory per launch.',
    cachePolicy: 'Fresh application caches; OS filesystem caches are not cleared. Sequential launches on the same runner.',
    boundary:
      'Main, shared process and extension host: profiler enabled before releasing inspect-brk. Renderer: earliest discoverable workbench target (initial renderer execution can be missed). Stop: VS Code startup-profiler marker deletion after LifecyclePhase.Eventually and installed-extension registration.',
    overhead:
      'Inspector pauses and CPU sampling perturb startup. Profile durations are sampling windows, not uninstrumented startup latency.',
    runs: [] as { run: number; profiles: Record<string, { file?: string; error?: string; attachedMs?: number }>; error?: string }[],
  }
  for (let run = 1; run <= samples; run++) {
    const folder = join(output, `run-${run}`)
    await mkdir(join(folder, 'user-data', 'User'), { recursive: true })
    await mkdir(join(folder, 'extensions'))
    await writeJson(join(folder, 'user-data', 'User', 'settings.json'), {
      'telemetry.telemetryLevel': 'off',
      'update.mode': 'none',
      'extensions.autoUpdate': false,
      'workbench.startupEditor': 'none',
      'workbench.enableExperiments': false,
      'security.workspace.trust.enabled': false,
    })
    const marker = join(folder, 'startup-ready')
    await writeFile(marker, '')
    const ports = Object.fromEntries(await Promise.all(processes.map(async (name) => [name, await freePort()])))
    const args = [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--skip-welcome',
      '--skip-release-notes',
      '--new-window',
      '--disable-workspace-trust',
      '--password-store=basic',
      '--no-cached-data',
      `--user-data-dir=${join(folder, 'user-data')}`,
      `--extensions-dir=${join(folder, 'extensions')}`,
      `--shared-data-dir=${join(folder, 'shared')}`,
      `--prof-startup-prefix=${marker}`,
      `--inspect-brk=${ports.main}`,
      `--remote-debugging-port=${ports.renderer}`,
      '--remote-debugging-address=127.0.0.1',
      `--inspect-brk-sharedprocess=${ports['shared-process']}`,
      `--inspect-brk-extensions=${ports['extension-host']}`,
    ]
    const started = Date.now()
    const deadline = started + 90000
    const sessions = new Map<string, Inspector>()
    const result: (typeof manifest.runs)[number] = { run, profiles: {} }
    let log = ''
    let launchError: Error | undefined
    const child = spawn(resolve(executable), args, {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined, NODE_OPTIONS: undefined },
    })
    child.on('error', (error) => {
      launchError = error
    })
    const append = (data: Buffer) => {
      log = (log + data.toString()).slice(-1024 * 1024)
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    const wait = async <T>(probe: () => Promise<T | undefined>): Promise<T> => {
      while (Date.now() < deadline) {
        if (launchError) throw launchError
        if (child.exitCode !== null || child.signalCode !== null) throw new Error('VS Code exited before capture completed')
        const value = await probe()
        if (value !== undefined) return value
        await delay(20)
      }
      throw new Error('Startup capture timed out after 90 seconds')
    }
    try {
      await Promise.all(
        processes.map(async (name) => {
          try {
            const url = await wait(async () => {
              try {
                const response = await fetch(`http://127.0.0.1:${ports[name]}/json/list`, { signal: AbortSignal.timeout(1000) })
                const targets = (await response.json()) as { type: string; url: string; webSocketDebuggerUrl?: string }[]
                return targets.find((target) => name !== 'renderer' || (target.type === 'page' && target.url.includes('workbench')))
                  ?.webSocketDebuggerUrl
              } catch {
                return undefined
              }
            })
            const session = await Inspector.connect(url)
            sessions.set(name, session)
            await session.invoke('Profiler.enable')
            await session.invoke('Profiler.start')
            result.profiles[name] = { attachedMs: Date.now() - started }
            if (name !== 'renderer') await session.invoke('Runtime.runIfWaitingForDebugger')
          } catch (error) {
            result.profiles[name] = { error: String(error) }
          }
        }),
      )
      await wait(async () => {
        try {
          await access(marker)
          return undefined
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
          throw error
        }
      })
      for (const name of processes) {
        const session = sessions.get(name)
        if (!session || result.profiles[name]?.error) continue
        try {
          const { profile } = await session.invoke('Profiler.stop')
          if (!profile?.samples?.length) throw new Error('No CPU samples captured')
          const file = `run-${run}/${name}.cpuprofile`
          await writeJson(join(output, file), profile)
          result.profiles[name] = { ...result.profiles[name], file }
        } catch (error) {
          result.profiles[name] = { error: String(error) }
        }
      }
    } catch (error) {
      result.error = String(error)
      for (const name of processes) result.profiles[name] = { error: String(error) }
    } finally {
      for (const session of sessions.values()) session.dispose()
      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGTERM')
        } catch {}
        await delay(300)
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
      }
      await writeFile(join(folder, 'launch.log'), log)
      manifest.runs.push(result)
      await writeJson(join(output, 'manifest.json'), manifest)
    }
  }
  if (manifest.runs.some((run) => processes.some((name) => !run.profiles[name]?.file))) {
    throw new Error(`Incomplete startup capture; see ${join(output, 'manifest.json')}`)
  }
}
