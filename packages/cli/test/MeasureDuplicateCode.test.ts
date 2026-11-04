import { afterEach, beforeEach, expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { parseOptions } from '../src/parts/MeasureDuplicateCode/MeasureDuplicateCode.ts'

const execFileAsync = promisify(execFile)
const cli = fileURLToPath(new URL('../bin/test.js', import.meta.url))
let directory: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'duplicate-code-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

test('CLI scans multiple files without initializing a VS Code test run and produces a deterministic report', async () => {
  const first = join(directory, 'first.js')
  const second = join(directory, 'second.js')
  const output = join(directory, 'reports', 'result.json')
  await writeFile(first, 'function add(a,b){return a+b}')
  await writeFile(second, 'const addition=(x,y)=>x+y; const different=(x,y)=>x-y')
  const argv = [
    cli,
    '--measure',
    'duplicate-code',
    '--source-file',
    first,
    '--source-file',
    second,
    '--source-file',
    first,
    '--duplicate-code-output',
    output,
    '--cwd',
    join(directory, 'nonexistent-tests'),
    '--watch',
    '--only',
    'nonexistent-test',
  ]
  const { stdout } = await execFileAsync(process.execPath, argv)
  expect(stdout).toContain('1 groups, 1 duplicate functions')
  const original = await readFile(output, 'utf8')
  const report = JSON.parse(original)
  expect(report.measure).toBe('duplicate-code')
  expect(report.files).toHaveLength(2)
  expect(report.summary).toEqual({ functions: 3, skippedDynamicFunctions: 0, duplicateGroups: 1, duplicateFunctions: 1 })
  expect(report.groups[0]).toMatchObject({ count: 2, duplicateBytes: 10 })
  expect(report.groups[0].occurrences.map((item: { name: string }) => item.name)).toEqual(['add', 'addition'])
  await execFileAsync(process.execPath, argv)
  expect(await readFile(output, 'utf8')).toBe(original)
})

test('CLI reports syntax errors without writing a partial report', async () => {
  const source = join(directory, 'invalid.js')
  const output = join(directory, 'result.json')
  await writeFile(source, 'function {')
  await expect(
    execFileAsync(process.execPath, [cli, '--measure', 'duplicate-code', '--source-file', source, '--duplicate-code-output', output]),
  ).rejects.toThrow('duplicate-code failed')
  await expect(readFile(output)).rejects.toMatchObject({ code: 'ENOENT' })
})

test('CLI reports zero groups for unique functions', async () => {
  const source = join(directory, 'unique.js')
  const output = join(directory, 'result.json')
  await writeFile(source, 'const a=x=>x+1;const b=x=>x+2')
  await execFileAsync(process.execPath, [cli, '--measure', 'duplicate-code', '--source-file', source, '--duplicate-code-output', output])
  expect(JSON.parse(await readFile(output, 'utf8')).groups).toEqual([])
})

test('resolves an existing VS Code installation', async () => {
  const bundle = join(directory, 'resources/app/out/vs/workbench/workbench.desktop.main.js')
  await mkdir(join(directory, 'resources/app/out/vs/workbench'), { recursive: true })
  await writeFile(bundle, '')
  expect((await parseOptions(['--vscode-path', directory])).files).toEqual([bundle])
})

test('requires explicit existing inputs and validates flag values', async () => {
  await expect(parseOptions([])).rejects.toThrow('requires --source-file')
  await expect(parseOptions(['--source-file'])).rejects.toThrow('requires a value')
  await expect(parseOptions(['--source-file', '--watch'])).rejects.toThrow('requires a value')
  await expect(parseOptions(['--source-file', 'missing', '--source-type', 'invalid'])).rejects.toThrow('--source-type')
  await expect(parseOptions(['--source-file', join(directory, 'missing.js')])).rejects.toMatchObject({ code: 'ENOENT' })
  await expect(parseOptions(['--vscode-path', directory])).rejects.toThrow('Cannot find workbench.desktop.main.js')
})

test('rejects overwriting an input file, including aliases', async () => {
  const source = join(directory, 'source.js')
  const alias = join(directory, 'alias.js')
  await writeFile(source, '')
  await expect(parseOptions(['--source-file', source, '--duplicate-code-output', source])).rejects.toThrow('must not overwrite')
  if (process.platform === 'win32') return
  await symlink(source, alias)
  await expect(parseOptions(['--source-file', source, '--duplicate-code-output', alias])).rejects.toThrow('must not overwrite')
})
