import { expect, test } from '@jest/globals'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import * as ModifyEsbuildConfig from '../src/parts/ModifyEsbuildConfig/ModifyEsbuildConfig.ts'

test('modifyEsbuildConfig - enables sourcemap in esbuild.js', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  sourcemap: false,
})
`

  await writeFile(join(tempRepo, 'esbuild.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.js'), 'utf8')
  expect(modifiedContent).toContain('sourcemap: true')
  expect(modifiedContent).not.toContain('sourcemap: false')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - enables sourcemap in esbuild.config.js', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `export default {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourceMap: false,
}
`

  await writeFile(join(tempRepo, 'esbuild.config.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.config.js'), 'utf8')
  expect(modifiedContent).toContain('sourceMap: true')
  expect(modifiedContent).not.toContain('sourceMap: false')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - adds sourcemap to build call', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
})
`

  await writeFile(join(tempRepo, 'esbuild.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.js'), 'utf8')
  expect(modifiedContent).toContain('sourcemap: true')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - adds sourcemap to export default config', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `export default {
  entryPoints: ['src/index.ts'],
  bundle: true,
}
`

  await writeFile(join(tempRepo, 'esbuild.config.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.config.js'), 'utf8')
  expect(modifiedContent).toContain('sourcemap: true')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - finds config from package.json script', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const packageJson = {
    scripts: {
      compile: 'esbuild --config scripts/build.js',
    },
  }
  await writeFile(join(tempRepo, 'package.json'), JSON.stringify(packageJson))

  const scriptsDir = join(tempRepo, 'scripts')
  await mkdir(scriptsDir, { recursive: true })

  const configContent = `export default {
  entryPoints: ['src/index.ts'],
  bundle: true,
}
`

  await writeFile(join(scriptsDir, 'build.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(scriptsDir, 'build.js'), 'utf8')
  expect(modifiedContent).toContain('sourcemap: true')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - handles sourcemap set to none', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  sourcemap: 'none',
})
`

  await writeFile(join(tempRepo, 'esbuild.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.js'), 'utf8')
  expect(modifiedContent).toContain("sourcemap: 'inline'")
  expect(modifiedContent).not.toContain("sourcemap: 'none'")

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - throws error when config file not found', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const packageJson = {
    scripts: {
      compile: 'npm run build',
    },
  }
  await writeFile(join(tempRepo, 'package.json'), JSON.stringify(packageJson))

  await expect(ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)).rejects.toThrow('Could not find esbuild config file')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - throws VError when file operations fail', async () => {
  const tempRepo = '/invalid/path/that/does/not/exist'

  await expect(ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)).rejects.toThrow(
    `Failed to modify esbuild config in '${tempRepo}'`
  )
})

test('modifyEsbuildConfig - handles buildSync call', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
})
`

  await writeFile(join(tempRepo, 'esbuild.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.js'), 'utf8')
  expect(modifiedContent).toContain('sourcemap: true')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - handles module.exports config', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `module.exports = {
  entryPoints: ['src/index.ts'],
  bundle: true,
}
`

  await writeFile(join(tempRepo, 'esbuild.config.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.config.js'), 'utf8')
  expect(modifiedContent).toContain('sourcemap: true')

  await rm(tempRepo, { recursive: true, force: true })
})

test('modifyEsbuildConfig - does not modify if sourcemap already true', async () => {
  const tempRepo = join(tmpdir(), `test-modify-esbuild-${Date.now()}`)
  await mkdir(tempRepo, { recursive: true })

  const configContent = `import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  sourcemap: true,
})
`

  await writeFile(join(tempRepo, 'esbuild.js'), configContent)

  await ModifyEsbuildConfig.modifyEsbuildConfig(tempRepo)

  const modifiedContent = await readFile(join(tempRepo, 'esbuild.js'), 'utf8')
  expect(modifiedContent).toBe(configContent)

  await rm(tempRepo, { recursive: true, force: true })
})

