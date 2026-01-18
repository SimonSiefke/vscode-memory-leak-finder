import { expect, test } from '@jest/globals'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as ModifyEsbuildConfig from '../src/parts/ModifyEsbuildConfig/ModifyEsbuildConfig.ts'

test('modifyEsbuildConfig - replaces isDev linked false with linked linked', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

const isDev = process.env.NODE_ENV !== 'production'

esbuild.build({
  entryPoints: ['src/index.ts'],
  sourcemap: isDev ? 'linked' : false,
})
`

  await writeFile(join(tempRepo, '.esbuild.ts'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, '.esbuild.ts'), 'utf8')
  expect(modifiedContent).toContain("sourcemap: isDev ? 'linked' : 'linked'")
  expect(modifiedContent).not.toContain("sourcemap: isDev ? 'linked' : false")

  await rm(tempRepo, { force: true, recursive: true })
})

test('modifyEsbuildConfig - does not modify if pattern not found', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  sourcemap: true,
})
`

  await writeFile(join(tempRepo, '.esbuild.ts'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, '.esbuild.ts'), 'utf8')
  expect(modifiedContent).toBe(configContent)

  await rm(tempRepo, { force: true, recursive: true })
})

test('modifyEsbuildConfig - throws VError when file does not exist', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  await expect(ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)).rejects.toThrow(`Failed to modify esbuild config in '${tempRepo}'`)

  await rm(tempRepo, { force: true, recursive: true })
})
