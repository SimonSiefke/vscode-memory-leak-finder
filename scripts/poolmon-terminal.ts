import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { createWriteStream } from 'node:fs'
import { finished } from 'node:stream/promises'
import { appendFile, copyFile, cp, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { patchConptyArchive } from './patch-conpty-archive.ts'

const execFileAsync = promisify(execFile)

const stopDiagnosticVscode = async () => {
  const prefix = (join(process.cwd(), '.vscode-test') + '\\').replaceAll("'", "''")
  await execFileAsync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `
    $ErrorActionPreference = 'Stop'
    $owned = @(Get-CimInstance Win32_Process -Filter \"Name = 'Code.exe'\" |
      Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith('${prefix}', [StringComparison]::OrdinalIgnoreCase) })
    foreach ($process in $owned) {
      $current = Get-CimInstance Win32_Process -Filter \"ProcessId = $($process.ProcessId)\"
      if ($current -and $current.CreationDate -eq $process.CreationDate) {
        taskkill.exe /PID $process.ProcessId /T /F | Out-Null
      }
    }
    Start-Sleep -Seconds 2
  `,
    ],
    { timeout: 60_000, windowsHide: true },
  )
}

const mode = process.env.TERMINAL_DIAGNOSTIC_MODE || 'heap'
const videoMode = mode === 'video'
const evidence = join('.tmp', 'poolmon-terminal')
await mkdir(evidence, { recursive: true })

const exists = async (path: string) =>
  stat(path).then(
    () => true,
    (error) => {
      if (error.code === 'ENOENT') return false
      throw error
    },
  )

const run = async (args: string[], logPath: string) => {
  const log = createWriteStream(logPath)
  const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (chunk) => {
    log.write(chunk)
    process.stdout.write(chunk)
  })
  child.stderr.on('data', (chunk) => {
    log.write(chunk)
    process.stderr.write(chunk)
  })
  const code = await new Promise<number | null>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })
  log.end()
  await finished(log)
  return code
}

const summary = [
  '# Terminal PoolMon investigation',
  '',
  'VS Code 1.137.0; two warmup iterations, then the stated measured iterations. Each measurement starts with a fresh profile.',
  '',
  '| Trial | Runs | Snapshot | Code processes | Working set MiB | Private MiB |',
  '|---|---:|---|---:|---:|---:|',
]

let archivePath = ''
if (mode === 'comparison' || videoMode) {
  const smokeCode = await run(
    [
      'packages/cli/bin/test.js',
      '--cwd',
      'packages/e2e',
      '--only',
      'terminal-split',
      '--runs',
      '1',
      '--run-skipped-tests-anyway',
      '--vscode-version',
      '1.137.0',
    ],
    join(evidence, 'prepare.log'),
  )
  await stopDiagnosticVscode()
  const smokeLog = await readFile(join(evidence, 'prepare.log'), 'utf8')
  if (smokeCode !== 0 || !smokeLog.includes('SKIP (PASS)')) throw new Error('Product preparation smoke failed')
  const archives = []
  for await (const path of glob('.vscode-test/**/node_modules.asar')) archives.push(path)
  if (archives.length !== 1) throw new Error(`Expected one dependency archive, found ${archives.length}`)
  archivePath = archives[0]
  const { extractFile } = await import('../.tmp/asar-tools/node_modules/@electron/asar/lib/asar.js')
  await writeFile(join(evidence, 'node-pty-package.json'), extractFile(archivePath, join('node-pty', 'package.json')))
}
const trials = videoMode
  ? [{ scenario: 'terminal-conpty-demo', runs: 7, heap: false, fixed: true }]
  : mode === 'comparison'
    ? [
        { scenario: 'terminal-split', runs: 37, heap: false, fixed: false },
        { scenario: 'terminal-split', runs: 37, heap: false, fixed: true },
        { scenario: 'terminal-split', runs: 37, heap: true, fixed: true },
      ]
    : mode === 'heap'
      ? [{ scenario: 'terminal-split', runs: 37, heap: true, fixed: false }]
      : [
          { scenario: 'terminal-poolmon-idle', runs: 37, heap: false, fixed: false },
          { scenario: 'terminal-split', runs: 1, heap: false, fixed: false },
          { scenario: 'terminal-split', runs: 37, heap: false, fixed: false },
          { scenario: 'terminal-poolmon-dispose-all', runs: 37, heap: false, fixed: false },
        ]
let patched = false
for (const [index, { scenario, runs, heap: heapMode, fixed }] of trials.entries()) {
  if (fixed && !patched) {
    const candidateArchive = join('.tmp', 'node_modules.candidate.asar')
    const { before, after, verifiedFiles } = await patchConptyArchive(archivePath, candidateArchive)
    // Keep the archive path used by VS Code's dependency resolver. Every other file
    // is byte-for-byte verified, and the original .asar.unpacked native files stay in place.
    await rename(archivePath, `${archivePath}.original`)
    await rename(candidateArchive, archivePath)
    await writeFile(join(evidence, 'windowsPtyAgent.before.js'), before)
    await writeFile(join(evidence, 'windowsPtyAgent.after.js'), after)
    await writeFile(
      join(evidence, 'patch-hashes.json'),
      JSON.stringify(
        {
          before: createHash('sha256').update(before).digest('hex'),
          after: createHash('sha256').update(after).digest('hex'),
          verifiedFiles,
          unchangedNativeFiles: true,
        },
        null,
        2,
      ),
    )
    patched = true
  }
  const resultPath = videoMode
    ? join('.vscode-videos', 'video.webm')
    : heapMode
      ? join('.vscode-memory-leak-finder-results', 'pty-host', 'named-function-count3', `${scenario}.json`)
      : join('.vscode-memory-leak-finder-results', 'poolmon', `${scenario}.json`)
  for (let attempt = 1; attempt <= 3; attempt++) {
    const trial = `${index + 1}-${scenario}-${runs}-runs-${fixed ? 'fixed' : 'baseline'}-${videoMode ? 'video' : heapMode ? 'heap' : 'poolmon'}-attempt-${attempt}`
    const directory = join(evidence, trial)
    const archivedState = join('.tmp', 'poolmon-terminal-state', trial)
    await mkdir(directory, { recursive: true })
    await mkdir(archivedState, { recursive: true })
    // This script owns its fresh CI workspace. Archive state instead of sharing it between trials.
    for (const name of ['.vscode-user-data-dir', '.vscode-test-workspace', '.vscode-memory-leak-finder-results', '.vscode-videos']) {
      if (await exists(name)) await rename(name, join(archivedState, name))
    }
    const args = [
      'packages/cli/bin/test.js',
      '--cwd',
      'packages/e2e',
      '--only',
      scenario,
      '--vscode-version',
      '1.137.0',
      '--runs',
      String(runs),
      '--run-skipped-tests-anyway',
      ...(videoMode
        ? ['--record-video']
        : ['--check-leaks', '--measure-after', '--measure', heapMode ? 'named-function-count3' : 'poolmon']),
      ...(heapMode ? ['--inspect-ptyhost', '--timeout-between', '10000'] : []),
    ]
    const startedAt = new Date().toISOString()
    await writeFile(
      join(directory, 'invocation.json'),
      JSON.stringify({ startedAt, runs, fixed, args, harnessSha: process.env.GITHUB_SHA }, null, 2),
    )
    const code = await run(args, join(directory, 'run.log'))
    const hasResult = await exists(resultPath)
    if (hasResult && !videoMode) await copyFile(resultPath, join(directory, 'result.json'))
    if (heapMode && hasResult) await cp('.vscode-heapsnapshots', join(directory, 'heaps'), { recursive: true })
    await stopDiagnosticVscode()
    if (await exists('.vscode-user-data-dir/logs')) {
      await cp('.vscode-user-data-dir/logs', join(directory, 'application-logs'), { recursive: true })
    }
    const log = await readFile(join(directory, 'run.log'), 'utf8')
    if (videoMode) {
      if (code !== 0 || !hasResult || !log.includes('SKIP (PASS)') || !(await stat(resultPath)).size) {
        throw new Error(`${trial}: video scenario failed or no fresh recording`)
      }
      await copyFile(resultPath, join(directory, 'terminal-split.webm'))
      break
    }
    if (!hasResult || /SKIP \(FAIL\)|Test Suites:.*\b[1-9]\d* failed/.test(log)) {
      await writeFile(join(directory, 'invalid-attempt.txt'), `Scenario failed or no fresh result; exit ${code}.\n`)
      if (attempt === 3) throw new Error(`${trial}: no valid measurement after three attempts`)
      continue
    }
    if (heapMode) break
    const data = JSON.parse(await readFile(resultPath, 'utf8')).poolmon
    const snapshots = [
      ['before', data.snapshots.before],
      ['immediate', data.snapshots.after],
      ...data.idleSnapshots.map((entry) => [`idle-${entry.idleSeconds}s`, entry.snapshot]),
    ]
    if (data.idleSnapshots.length !== 3) throw new Error(`${trial}: missing idle snapshots`)
    for (const [phase, snapshot] of snapshots) {
      if (snapshot.processError) throw new Error(`${trial} ${phase}: ${snapshot.processError}`)
      if (!snapshot.processes.length) throw new Error(`${trial} ${phase}: empty process snapshot`)
      const rows = snapshot.processes.filter((row) => row.imageName.toLowerCase() === 'code.exe')
      const memory = rows.reduce((sum, row) => sum + row.memoryKb, 0) / 1024
      const privateMemory = rows.reduce((sum, row) => sum + (row.privateMemoryKb ?? 0), 0) / 1024
      summary.push(`| ${trial} | ${runs} | ${phase} | ${rows.length} | ${memory.toFixed(1)} | ${privateMemory.toFixed(1)} |`)
    }
    await writeFile(join(evidence, 'summary.md'), summary.join('\n') + '\n')
    // A leak verdict is data; failure to complete the scenario is not a valid measurement.
    if (code !== 0 && !data.isLeak) throw new Error(`${trial}: unexpected exit ${code}`)
    break
  }
}
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n')
