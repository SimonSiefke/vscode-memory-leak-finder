import { afterEach, expect, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { preserveCopilotRuntime } from '../src/parts/CopilotRuntime/CopilotRuntime.ts'
import { command, writeJson } from '../src/parts/Io/Io.ts'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test('packaged extension can import its pinned CLI SDK after product packaging strips it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'copilot-runtime-'))
  directories.push(root)
  const source = join(root, 'source'),
    build = join(root, 'build')
  const extension = join(source, 'extensions/copilot')
  const installed = join(extension, 'node_modules/@github/copilot')
  const packaged = join(build, 'resources/app/extensions/copilot')
  await writeJson(join(extension, 'package.json'), { dependencies: { '@github/copilot': '1.0.73' } })
  await writeJson(join(installed, 'package.json'), { type: 'module', version: '1.0.73', exports: { './sdk': './sdk/index.js' } })
  await mkdir(join(installed, 'sdk'), { recursive: true })
  await writeFile(join(installed, 'sdk/index.js'), "export const version = '1.0.73'\n")
  await writeFile(join(installed, 'sdk/runtime-asset.txt'), 'pinned runtime asset')
  await mkdir(join(packaged, 'node_modules/@github/copilot/sdk'), { recursive: true })
  await writeFile(join(packaged, 'probe.mjs'), "import { version } from '@github/copilot/sdk'; console.log(version)\n")
  await expect(command(process.execPath, ['probe.mjs'], { cwd: packaged })).rejects.toThrow('ERR_UNSUPPORTED_DIR_IMPORT')
  await preserveCopilotRuntime(source, build)
  expect(await command(process.execPath, ['probe.mjs'], { cwd: packaged })).toBe('1.0.73')
  expect(await readFile(join(packaged, 'node_modules/@github/copilot/sdk/runtime-asset.txt'), 'utf8')).toBe('pinned runtime asset')
})

test('historical revisions without the extension or dependency need no runtime', async () => {
  const root = await mkdtemp(join(tmpdir(), 'copilot-runtime-'))
  directories.push(root)
  await preserveCopilotRuntime(root, join(root, 'build'))
  await writeJson(join(root, 'extensions/copilot/package.json'), { dependencies: {} })
  await preserveCopilotRuntime(root, join(root, 'build'))
  await expect(
    readFile(join(root, 'build/resources/app/extensions/copilot/node_modules/@github/copilot/package.json')),
  ).rejects.toMatchObject({ code: 'ENOENT' })
})

test('an incomplete installed SDK fails during preparation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'copilot-runtime-'))
  directories.push(root)
  await writeJson(join(root, 'extensions/copilot/package.json'), { dependencies: { '@github/copilot': '1.0.73' } })
  await writeJson(join(root, 'extensions/copilot/node_modules/@github/copilot/package.json'), {
    type: 'module',
    exports: { './sdk': './sdk/index.js' },
  })
  await expect(preserveCopilotRuntime(root, join(root, 'build'))).rejects.toThrow('ERR_MODULE_NOT_FOUND')
})
