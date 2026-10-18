import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as io from '../src/parts/Io/Io.ts'

const sha = 'a'.repeat(40)
const reference = `simonsiefke/vscode@${sha}`
const command = jest.fn<typeof io.command>()
jest.unstable_mockModule('../src/parts/Io/Io.ts', () => ({ ...io, command }))
jest.unstable_mockModule('node:fs/promises', () => ({ ...fs, access: jest.fn(async () => {}) }))
const { prepareBuild, extractBuild } = await import('../src/parts/Prepare/Prepare.ts')
const directories: string[] = []
const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform')!
const archDescriptor = Object.getOwnPropertyDescriptor(process, 'arch')!
beforeEach(() => {
  Object.defineProperty(process, 'platform', { value: 'linux' })
  Object.defineProperty(process, 'arch', { value: 'x64' })
})
afterEach(async () => {
  Object.defineProperty(process, 'platform', platformDescriptor)
  Object.defineProperty(process, 'arch', archDescriptor)
  command.mockReset()
  await Promise.all(directories.splice(0).map((path) => fs.rm(path, { recursive: true, force: true })))
})

test('fork build passes the owner to the CLI, verifies the raw checkout SHA, and preserves qualified metadata', async () => {
  const output = await fs.mkdtemp(join(tmpdir(), 'large-prepare-test-'))
  directories.push(output)
  command.mockImplementation(async (executable, args) => {
    if (executable === 'git') return sha
    if (executable === 'tar') await fs.writeFile(args[1]!, 'build archive')
    return ''
  })
  const metadata = await prepareBuild(reference, output)
  expect(command.mock.calls[0]![1]).toEqual(expect.arrayContaining(['--commit', `simonsiefke/${sha}`, '--build-vscode-minified']))
  expect(command.mock.calls[1]).toEqual([
    'git',
    ['rev-parse', 'HEAD'],
    expect.objectContaining({ cwd: expect.stringContaining(join(`${sha}-minified`, 'source')) }),
  ])
  expect(metadata.commit).toBe(reference)
  expect(JSON.parse(await fs.readFile(join(output, 'status.json'), 'utf8')).commit).toBe(reference)
  await expect(extractBuild(output, `other/vscode@${sha}`)).rejects.toThrow('metadata')
  await expect(extractBuild(output, reference)).resolves.toBe(join(output, 'VSCode-linux-x64/code-oss'))
})

test('fork preparation refuses a checkout with the wrong SHA before archiving', async () => {
  const output = await fs.mkdtemp(join(tmpdir(), 'large-prepare-test-'))
  directories.push(output)
  command.mockResolvedValue('b'.repeat(40))
  await expect(prepareBuild(reference, output)).rejects.toThrow(`expected ${sha}`)
  expect(command.mock.calls.some(([executable]) => executable === 'tar')).toBe(false)
})

test('preparation refuses tracked source changes before archiving', async () => {
  const output = await fs.mkdtemp(join(tmpdir(), 'large-prepare-test-'))
  directories.push(output)
  command.mockImplementation(async (executable, args) => {
    if (executable === 'git' && args[0] === 'diff') throw new Error('Tracked build source was changed')
    return executable === 'git' ? sha : ''
  })
  await expect(prepareBuild(reference, output)).rejects.toThrow('Tracked build source was changed')
  expect(command.mock.calls.some(([executable]) => executable === 'tar')).toBe(false)
})
