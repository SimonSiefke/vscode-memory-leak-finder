import { afterEach, beforeEach, expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { SourceMapGenerator } from 'source-map'
import { parseOptions } from '../src/parts/MeasureDuplicateCode/MeasureDuplicateCode.ts'

const execFileAsync = promisify(execFile)
const cli = fileURLToPath(new URL('../bin/test.js', import.meta.url))
let directory: string

beforeEach(async () => {
  // Match the CLI's canonical paths when the temporary directory has an alias.
  directory = await realpath(await mkdtemp(join(tmpdir(), 'duplicate-code-')))
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

const duplicateSource = 'function add(a,b){return a+b}; const addition=(x,y)=>x+y'
const makeMap = (): string => {
  const map = new SourceMapGenerator({ file: 'bundle.js' })
  map.addMapping({ generated: { line: 1, column: 0 }, original: { line: 10, column: 2 }, source: '../../../src/first.ts', name: 'add' })
  map.addMapping({
    generated: { line: 1, column: duplicateSource.indexOf('(x,y)') },
    original: { line: 20, column: 4 },
    source: './src/second.ts',
    name: 'addition',
  })
  map.setSourceContent('../../../src/first.ts', '\n'.repeat(9) + '  function add(a: number, b: number) { return a + b }')
  map.setSourceContent('./src/second.ts', '\n'.repeat(19) + '    const addition = (x: number, y: number) => x + y;')
  return map.toString()
}

test.each(['relative', 'sibling', 'inline-base64', 'inline-url'])(
  'CLI resolves %s source maps only for duplicate occurrences',
  async (kind) => {
    const source = join(directory, 'bundle.js')
    const output = join(directory, 'result.json')
    let directive = ''
    if (kind === 'relative') {
      await mkdir(join(directory, 'maps'))
      await writeFile(join(directory, 'maps', 'bundle.js.map'), makeMap())
      directive = '\n//# sourceMappingURL=maps/bundle.js.map'
    } else if (kind === 'sibling') await writeFile(source + '.map', makeMap())
    else if (kind === 'inline-base64')
      directive = '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' + Buffer.from(makeMap()).toString('base64')
    else directive = '\n/*# sourceMappingURL=data:application/json,' + encodeURIComponent(makeMap()) + ' */'
    await writeFile(source, duplicateSource + ';const unique=x=>x-1' + directive)
    await execFileAsync(process.execPath, [cli, '--measure', 'duplicate-code', '--source-file', source, '--duplicate-code-output', output])
    const report = JSON.parse(await readFile(output, 'utf8'))
    expect(report.files[0].sourceMap).toMatchObject({ status: 'mapped', occurrences: 2, mapped: 2 })
    expect(report.groups[0].occurrences).toEqual([
      {
        file: `${source}:1:1`,
        originalName: 'add',
        name: 'add',
        bytes: 29,
        originalFile: 'src/first.ts:10:3',
        preview: 'function add(a: number, b: number) { return a + b }',
      },
      {
        file: `${source}:1:${duplicateSource.indexOf('(x,y)') + 1}`,
        originalName: 'addition',
        name: 'addition',
        bytes: 10,
        originalFile: 'src/second.ts:20:5',
        preview: 'const addition = (x: number, y: number) => x + y;',
      },
    ])
  },
)

test.each(['missing', 'malformed', 'oversized', 'disabled'])('CLI retains generated positions when source maps are %s', async (kind) => {
  const source = join(directory, 'bundle.js')
  const output = join(directory, 'result.json')
  await writeFile(source, duplicateSource)
  if (kind === 'malformed' || kind === 'disabled') await writeFile(source + '.map', 'invalid JSON')
  if (kind === 'oversized') {
    const { open } = await import('node:fs/promises')
    const file = await open(source + '.map', 'w')
    try {
      await file.truncate(129 * 1024 * 1024)
    } finally {
      await file.close()
    }
  }
  await execFileAsync(process.execPath, [
    cli,
    '--measure',
    'duplicate-code',
    '--source-file',
    source,
    '--duplicate-code-output',
    output,
    ...(kind === 'disabled' ? ['--no-source-maps'] : []),
  ])
  const report = JSON.parse(await readFile(output, 'utf8'))
  expect(report.files[0].sourceMap).toMatchObject({ status: kind === 'disabled' ? 'skipped' : 'unavailable', occurrences: 2, mapped: 0 })
  expect(report.groups[0].occurrences[0]).toEqual({
    file: `${source}:1:1`,
    originalName: null,
    name: 'add',
    bytes: 29,
    originalFile: null,
    preview: null,
  })
})

test('does not load a source map for unique functions', async () => {
  const source = join(directory, 'unique.js')
  const output = join(directory, 'result.json')
  await writeFile(source, 'const a=()=>1; const b=()=>2')
  await writeFile(source + '.map', 'invalid JSON')
  await execFileAsync(process.execPath, [cli, '--measure', 'duplicate-code', '--source-file', source, '--duplicate-code-output', output])
  expect(JSON.parse(await readFile(output, 'utf8')).files[0].sourceMap).toMatchObject({ status: 'skipped', occurrences: 0, mapped: 0 })
})
