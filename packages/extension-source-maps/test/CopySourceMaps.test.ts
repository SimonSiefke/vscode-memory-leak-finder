import { expect, test } from '@jest/globals'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as CopySourceMaps from '../src/parts/CopySourceMaps/CopySourceMaps.ts'

test('copySourceMaps - copies source maps from dist directory', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const distDir = join(tempRepo, 'dist')
  await mkdir(distDir, { recursive: true })

  const sourceMapContent = '{"version":3,"sources":["src/index.ts"]}'
  const jsContent = 'console.log("test")'
  await writeFile(join(distDir, 'extension.js.map'), sourceMapContent)
  await writeFile(join(distDir, 'extension.js'), jsContent)

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')

  const extensionId = 'github.test-extension-1.0.0'
  const outputMapPath = join(tempOutput, extensionId, 'dist', 'extension.js.map')
  const outputJsPath = join(tempOutput, extensionId, 'dist', 'extension.js')

  const copiedMapContent = await readFile(outputMapPath, 'utf8')
  const copiedJsContent = await readFile(outputJsPath, 'utf8')

  expect(copiedMapContent).toBe(sourceMapContent)
  expect(copiedJsContent).toBe(jsContent)

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - copies source maps from out directory', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const outDir = join(tempRepo, 'out')
  await mkdir(outDir, { recursive: true })

  const sourceMapContent = '{"version":3}'
  await writeFile(join(outDir, 'main.js.map'), sourceMapContent)

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')

  const extensionId = 'github.test-extension-1.0.0'
  const outputMapPath = join(tempOutput, extensionId, 'out', 'main.js.map')

  const copiedMapContent = await readFile(outputMapPath, 'utf8')
  expect(copiedMapContent).toBe(sourceMapContent)

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - copies source maps from nested extension directory', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const extensionDistDir = join(tempRepo, 'extension', 'dist')
  await mkdir(extensionDistDir, { recursive: true })

  const sourceMapContent = '{"version":3}'
  await writeFile(join(extensionDistDir, 'extension.js.map'), sourceMapContent)

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')

  const extensionId = 'github.test-extension-1.0.0'
  const outputMapPath = join(tempOutput, extensionId, 'extension', 'dist', 'extension.js.map')

  const copiedMapContent = await readFile(outputMapPath, 'utf8')
  expect(copiedMapContent).toBe(sourceMapContent)

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - copies multiple source maps preserving structure', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const distDir = join(tempRepo, 'dist')
  const subDir = join(distDir, 'subdir')
  await mkdir(subDir, { recursive: true })

  await writeFile(join(distDir, 'main.js.map'), '{"version":3}')
  await writeFile(join(subDir, 'util.js.map'), '{"version":3}')

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')

  const extensionId = 'github.test-extension-1.0.0'
  const mainMapPath = join(tempOutput, extensionId, 'dist', 'main.js.map')
  const utilMapPath = join(tempOutput, extensionId, 'dist', 'subdir', 'util.js.map')

  await expect(readFile(mainMapPath, 'utf8')).resolves.toBe('{"version":3}')
  await expect(readFile(utilMapPath, 'utf8')).resolves.toBe('{"version":3}')

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - handles missing JS file gracefully', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const distDir = join(tempRepo, 'dist')
  await mkdir(distDir, { recursive: true })

  await writeFile(join(distDir, 'extension.js.map'), '{"version":3}')

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')

  const extensionId = 'github.test-extension-1.0.0'
  const outputMapPath = join(tempOutput, extensionId, 'dist', 'extension.js.map')

  await expect(readFile(outputMapPath, 'utf8')).resolves.toBe('{"version":3}')

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - throws error when no source maps found', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  await expect(CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')).rejects.toThrow(
    'No source map files found in the repository',
  )

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true }).catch(() => {})
})

test('copySourceMaps - creates correct extension ID format', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const distDir = join(tempRepo, 'dist')
  await mkdir(distDir, { recursive: true })

  await writeFile(join(distDir, 'extension.js.map'), '{"version":3}')

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'copilot-chat', '0.36.2025121004')

  const extensionId = 'github.copilot-chat-0.36.2025121004'
  const outputMapPath = join(tempOutput, extensionId, 'dist', 'extension.js.map')

  await expect(readFile(outputMapPath, 'utf8')).resolves.toBe('{"version":3}')

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - strips v prefix from version', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const distDir = join(tempRepo, 'dist')
  await mkdir(distDir, { recursive: true })

  await writeFile(join(distDir, 'extension.js.map'), '{"version":3}')

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'copilot-chat', 'v0.36.2025121004')

  const extensionId = 'github.copilot-chat-0.36.2025121004'
  const outputMapPath = join(tempOutput, extensionId, 'dist', 'extension.js.map')

  await expect(readFile(outputMapPath, 'utf8')).resolves.toBe('{"version":3}')

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})

test('copySourceMaps - throws VError when copy fails', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  // Create a file at the target location so directory creation will fail
  const tempOutputFile = join(tmpdir(), `test-copy-source-maps-output-file-${Date.now()}`)
  await writeFile(tempOutputFile, 'this is a file, not a directory')

  const distDir = join(tempRepo, 'dist')
  await mkdir(distDir, { recursive: true })
  await writeFile(join(distDir, 'extension.js.map'), '{"version":3}')

  await expect(CopySourceMaps.copySourceMaps(tempRepo, tempOutputFile, 'test-extension', '1.0.0')).rejects.toThrow(
    `Failed to copy source maps from '${tempRepo}' to '${tempOutputFile}'`,
  )

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutputFile, { force: true }).catch(() => {})
})

test('copySourceMaps - checks multiple possible directories', async () => {
  const tempRepo = join(tmpdir(), `test-copy-source-maps-repo-${Date.now()}`)
  const tempOutput = join(tmpdir(), `test-copy-source-maps-output-${Date.now()}`)
  const buildDir = join(tempRepo, 'build')
  await mkdir(buildDir, { recursive: true })

  await writeFile(join(buildDir, 'extension.js.map'), '{"version":3}')

  await CopySourceMaps.copySourceMaps(tempRepo, tempOutput, 'test-extension', '1.0.0')

  const extensionId = 'github.test-extension-1.0.0'
  const outputMapPath = join(tempOutput, extensionId, 'build', 'extension.js.map')

  await expect(readFile(outputMapPath, 'utf8')).resolves.toBe('{"version":3}')

  await rm(tempRepo, { force: true, recursive: true })
  await rm(tempOutput, { force: true, recursive: true })
})
