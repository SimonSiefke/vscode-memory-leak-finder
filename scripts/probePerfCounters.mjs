import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { cpus, release } from 'node:os'

const read = (path) => {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch (error) {
    return String(error)
  }
}
const system = {
  arch: process.arch,
  kernel: release(),
  cpu: cpus()[0]?.model,
  perfEventParanoid: read('/proc/sys/kernel/perf_event_paranoid'),
  eventSources: readdirSync('/sys/bus/event_source/devices'),
}
const workload = 'const end=Date.now()+250; let value=0; while(Date.now()<end) value++; console.log(value)'
const attempts = []
for (const privileged of [false, true]) {
  const cases = privileged
    ? [['instructions:u', 'cycles:u']]
    : [['instructions:u', 'cycles:u'], ['instructions:u'], ['cycles:u'], ['instructions'], ['cycles'], ['task-clock']]
  for (const events of cases) {
    const args = ['stat', '--no-big-num', '-x', ',', '-e', events.join(','), '--', process.execPath, '-e', workload]
    const result = spawnSync(privileged ? 'sudo' : 'perf', privileged ? ['-n', 'perf', ...args] : args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15_000,
      env: { ...process.env, LC_ALL: 'C' },
    })
    const stderr = result.stderr ?? ''
    const metrics = events.map((event) => {
      const row = stderr
        .split('\n')
        .map((line) => line.trim().split(','))
        .find((fields) => fields[2]?.trim() === event)
      const value = Number(row?.[0]?.trim())
      return { event, value: Number.isFinite(value) ? value : null, positive: result.status === 0 && Number.isFinite(value) && value > 0 }
    })
    attempts.push({ privileged, events, exitCode: result.status, error: result.error?.message, stdout: result.stdout, stderr, metrics })
  }
}
const hardwareAvailable = attempts[0].metrics.every((metric) => metric.positive)
const report = { system, hardwareAvailable, attempts }
writeFileSync('perf-capabilities.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Counter capability: ${system.arch}\n\nNative instruction + cycle counters: **${hardwareAvailable ? 'available' : 'unavailable'}**\n\n| Mode | Events | Positive counters |\n| --- | --- | --- |\n` +
      attempts
        .map(
          (attempt) =>
            `| ${attempt.privileged ? 'sudo' : 'user'} | ${attempt.events.join(', ')} | ${attempt.metrics.map((metric) => `${metric.event}: ${metric.positive ? metric.value : 'unavailable'}`).join('; ')} |`,
        )
        .join('\n') +
      '\n',
  )
}
if (!hardwareAvailable) process.exitCode = 1
