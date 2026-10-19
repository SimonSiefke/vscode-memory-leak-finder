import { afterAll, expect, jest, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as io from '../src/parts/Io/Io.ts'
import * as prepare from '../src/parts/Prepare/Prepare.ts'

const root = await mkdtemp(join(tmpdir(), 'smoke-prepare-'))
const sha = 'a'.repeat(40)
const fixtureCommit = 'b'.repeat(40)
const command = jest.fn<typeof io.command>()
jest.unstable_mockModule('../src/parts/Io/Io.ts', () => ({ ...io, command }))
jest.unstable_mockModule('../src/parts/Prepare/Prepare.ts', () => ({ ...prepare, repositoryRoot: root }))
const { prepareSmoke, extractSmoke } = await import('../src/parts/Smoke/Smoke.ts')

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

test('shared smoke archive preserves runtime chat simulation scripts alongside compiled tests', async () => {
  const source = join(root, '.vscode-repos', `${sha}-minified`, 'source')
  const output = join(root, 'harness')
  const mockServer = 'scripts/chat-simulation/common/mock-llm-server.ts'
  const protocolRegistry = 'src/vs/platform/agentHost/common/state/protocol/version/registry.ts'
  for (const directory of [
    'test/smoke/out',
    'node_modules',
    'scripts/chat-simulation/common',
    'src/vs/platform/agentHost/common/state/protocol/version',
  ])
    await mkdir(join(source, directory), { recursive: true })
  for (const file of ['package.json', 'product.json']) await writeFile(join(source, file), '{}')
  await writeFile(join(source, 'package.json'), JSON.stringify({ type: 'module' }))
  await writeFile(join(source, 'scripts/package.json'), JSON.stringify({ type: 'commonjs' }))
  await writeFile(join(source, mockServer), 'const startServer: () => void = () => {}; module.exports = { startServer };\n')
  await writeFile(join(source, 'test/smoke/out/main.js'), '// compiled smoke suite\n')
  await writeFile(join(source, protocolRegistry), "export const PROTOCOL_VERSION = '1.0.0';\n")
  command.mockImplementation(async (executable, args, options) => {
    if (executable === 'git') {
      if (args[0] === 'clone') {
        await mkdir(args.at(-1)!, { recursive: true })
        await writeFile(join(args.at(-1)!, 'app.js'), '// smoke fixture\n')
        return ''
      }
      return options?.cwd === source ? sha : fixtureCommit
    }
    if (executable === 'npm') return '' // Compilation is independent of runtime archive contents.
    return io.command(executable, args, options)
  })
  await prepareSmoke(sha, output)
  await extractSmoke(output)
  expect(await readFile(join(output, mockServer), 'utf8')).toBe(await readFile(join(source, mockServer), 'utf8'))
  expect(await io.command(process.execPath, ['-e', `console.log(typeof require('./${mockServer}').startServer)`], { cwd: output })).toBe(
    'function',
  )
  expect(await readFile(join(output, 'test/smoke/out/main.js'), 'utf8')).toContain('compiled smoke suite')
  expect(await readFile(join(output, 'fixture/app.js'), 'utf8')).toContain('smoke fixture')
  // The SSH Dev Container fixture reads this source registry when negotiating its handshake.
  expect(await readFile(join(output, protocolRegistry), 'utf8')).toMatch(/PROTOCOL_VERSION\s*=\s*'1\.0\.0'/)
})
