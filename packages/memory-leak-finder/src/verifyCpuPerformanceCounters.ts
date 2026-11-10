import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { parsePerfStatOutput } from './parts/CpuPerformanceCounters/CpuPerformanceCounters.ts'

const execFileAsync = promisify(execFile)

export const verifyCpuPerformanceCounters = async () => {
  const { stderr } = await execFileAsync(
    'perf',
    [
      'stat',
      '--no-big-num',
      '-x',
      ',',
      '-e',
      'instructions:u,cycles:u',
      process.execPath,
      '-e',
      'const end = Date.now() + 250; while (Date.now() < end) {}',
    ],
    { timeout: 15_000, env: { ...process.env, LC_ALL: 'C' } },
  )
  const counters = parsePerfStatOutput(stderr)
  if (counters.instructions === null || counters.instructions <= 0) {
    throw new Error(`The runner did not provide a positive hardware instruction count. perf output:\n${stderr}`)
  }
  return { available: true, arch: process.arch, ...counters, rawOutput: stderr }
}

const main = async () => {
  let availability
  try {
    availability = await verifyCpuPerformanceCounters()
  } catch (error) {
    availability = { available: false, arch: process.arch, reason: String(error) }
    process.exitCode = 1
  }
  const outputPath = join(
    import.meta.dirname,
    '../../..',
    '.vscode-memory-leak-finder-results',
    'cpu-performance-counters-availability.json',
  )
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(availability, null, 2))
  console.log(availability)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
