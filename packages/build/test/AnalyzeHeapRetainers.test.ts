import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, test } from '@jest/globals'

const execute = promisify(execFile)
const script = fileURLToPath(new URL('../src/analyzeHeapRetainers.ts', import.meta.url))
const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

const fixture = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'heap-retainer-properties-'))
  directories.push(directory)
  const path = join(directory, 'heap.json')
  const strings = [
    '',
    '(GC roots)',
    'Object',
    'prototype',
    'backupFolder',
    'remoteAuthority',
    'value',
    'unrelated',
    'matching',
    'both',
    'inherited',
    'contextOnly',
    'weakOnly',
    '__proto__',
  ]
  // Node records: type, name, id, self_size, edge_count.
  const nodes = [
    0, 1, 1, 0, 6, 1, 2, 3, 8, 0, 1, 2, 5, 8, 1, 1, 2, 7, 8, 2, 1, 2, 9, 8, 1, 1, 2, 11, 8, 1, 1, 2, 13, 8, 1, 1, 3, 15, 8, 1, 2, 6, 17, 8,
    0,
  ]
  // Edge records: type, name_or_index, to_node (node-field offset).
  const edges = [
    0, 7, 5, 0, 8, 10, 0, 9, 15, 0, 10, 20, 0, 11, 25, 2, 12, 30, 0, 4, 40, 0, 4, 40, 0, 5, 40, 0, 13, 35, 1, 4, 40, 0, 4, 40, 0, 4, 40,
  ]
  await writeFile(
    path,
    JSON.stringify({
      snapshot: {
        meta: {
          node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
          node_types: [['synthetic', 'object', 'string']],
          edge_fields: ['type', 'name_or_index', 'to_node'],
          edge_types: [['property', 'context', 'weak']],
        },
      },
      nodes,
      edges,
      strings,
    }),
  )
  return path
}

test('filters anonymous objects by their own property edges', async () => {
  const { stdout } = await execute(process.execPath, [
    script,
    await fixture(),
    '--name',
    'Object',
    '--property',
    'backupFolder',
    '--paths-per-name',
    '10',
  ])
  expect(stdout).toContain('Object: 3 path(s)')
  expect(stdout).toContain('--matching-->')
  expect(stdout).toContain('--both-->')
  expect(stdout).toContain('is not strongly reachable')
  expect(stdout).not.toContain('--unrelated-->')
  expect(stdout).not.toContain('--inherited-->')
  expect(stdout).not.toContain('--contextOnly-->')
  expect(stdout).not.toContain('--weakOnly-->')
})

test('requires every requested own property', async () => {
  const { stdout } = await execute(process.execPath, [
    script,
    await fixture(),
    '--name',
    'Object',
    '--property',
    'backupFolder',
    '--property',
    'remoteAuthority',
  ])
  expect(stdout).toContain('Object: 1 path(s)')
  expect(stdout).toContain('--both-->')
  expect(stdout).not.toContain('--matching-->')
})

test('finds objects by property when their constructor name is unknown or minified', async () => {
  const { stdout } = await execute(process.execPath, [script, await fixture(), '--property', 'remoteAuthority'])
  expect(stdout).toContain('Object: 1 path(s)')
  expect(stdout).toContain('--both-->')
})

test('reports no paths when no object has the requested property', async () => {
  const { stdout } = await execute(process.execPath, [script, await fixture(), '--name', 'Object', '--property', 'missing'])
  expect(stdout).toContain('Object: 0 path(s)')
})

test('keeps unfiltered name lookup compatible', async () => {
  const { stdout } = await execute(process.execPath, [script, await fixture(), '--name', 'Object'])
  expect(stdout).toContain('Object: 3 path(s)')
  expect(stdout).toContain('--unrelated-->')
  expect(stdout).toContain('--matching-->')
  expect(stdout).toContain('--both-->')
})

test('rejects a missing property name', async () => {
  await expect(execute(process.execPath, [script, await fixture(), '--name', 'Object', '--property'])).rejects.toThrow('--property')
})
