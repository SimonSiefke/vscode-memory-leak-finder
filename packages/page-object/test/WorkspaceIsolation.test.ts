import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const exec = jest.fn(async (_command: string, _args: unknown, _options: unknown) => ({}))
jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({ exec }))
jest.unstable_mockModule('../src/parts/QuickPick/QuickPick.ts', () => ({ create: () => ({ executeCommand: async () => {} }) }))
const Git = await import('../src/parts/Git/Git.ts')
const Workspace = await import('../src/parts/Workspace/Workspace.ts')
const Extensions = await import('../src/parts/Extensions/Extensions.ts')
const directories: string[] = []
afterEach(async () => {
  jest.clearAllMocks()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const parameters = (workspacePath: string, extensionsPath: string): any => {
  const locator: any = { first: () => locator, locator: () => locator }
  return {
    workspacePath,
    extensionsPath,
    page: { waitForIdle: async () => {}, locator: () => locator },
    electronApp: {},
    ideVersion: { major: 1, minor: 140, patch: 0 },
    platform: 'linux',
    VError: Error,
    expect: () => ({ toBeVisible: async () => {}, toHaveText: async () => {} }),
  }
}

test('two sample contexts route workspace writes and Git commands to separate directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'workspace-isolation-'))
  directories.push(root)
  for (const side of ['before', 'after']) {
    const context = parameters(join(root, side, 'workspace'), join(root, side, 'extensions'))
    await Workspace.create(context).add({ name: 'sample.txt', content: side })
    await Git.create(context).add()
    expect(await readFile(join(context.workspacePath, 'sample.txt'), 'utf8')).toBe(side)
  }
  expect(exec.mock.calls.map((call) => (call[2] as any).cwd)).toEqual([join(root, 'before/workspace'), join(root, 'after/workspace')])
})

test('extension fixture installation writes only into the supplied sample extension directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'extension-isolation-'))
  directories.push(root)
  for (const side of ['before', 'after']) {
    const context = parameters(join(root, side, 'workspace'), join(root, side, 'extensions'))
    const extensions = Extensions.create(context)
    extensions.show = async () => {}
    extensions.search = async () => {}
    extensions.hide = async () => {}
    await extensions.add({ expectedName: 'helloworld-sample', path: 'packages/e2e/fixtures/sample.show-notification' })
    const fixture = JSON.parse(await readFile(join(context.extensionsPath, 'sample.show-notification/package.json'), 'utf8'))
    expect(fixture.name).toBe('helloworld-sample')
  }
})
