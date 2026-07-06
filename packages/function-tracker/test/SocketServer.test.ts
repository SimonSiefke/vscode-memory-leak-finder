import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mockTransformCode =
  jest.fn<
    (code: string, options: { readonly filename?: string; readonly minify?: boolean; readonly trackingMode?: string }) => Promise<string>
  >()

jest.unstable_mockModule('../src/parts/Transform/Transform.ts', () => ({
  transformCode: mockTransformCode,
}))

const { transformFile } = await import('../src/parts/SocketServer/SocketServer.ts')

let root: string

beforeEach(async () => {
  jest.clearAllMocks()
  root = await mkdtemp(join(tmpdir(), 'function-tracker-socket-server-'))
  await rm(join(process.cwd(), '.vscode-workbench-tracked-modules'), { recursive: true, force: true })
  mockTransformCode.mockImplementation(async (code, options) => `/* ${options.trackingMode}:${options.filename} */\n${code}`)
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
  await rm(join(process.cwd(), '.vscode-workbench-tracked-modules'), { recursive: true, force: true })
})

test('transformFile transforms a requested js file and reuses unchanged cache output', async () => {
  const sourcePath = join(root, 'module.js')
  await writeFile(sourcePath, 'const value = {}\n')

  const first = await transformFile(sourcePath, 'allocations')
  const second = await transformFile(sourcePath, 'allocations')

  expect(first).toBe(`/* allocations:${sourcePath} */\nconst value = {}\n`)
  expect(second).toBe(first)
  expect(mockTransformCode).toHaveBeenCalledTimes(1)
  expect(mockTransformCode).toHaveBeenCalledWith('const value = {}\n', {
    filename: sourcePath,
    minify: true,
    trackingMode: 'allocations',
  })
})

test('transformFile regenerates when source metadata changes', async () => {
  const sourcePath = join(root, 'module.js')
  await writeFile(sourcePath, 'const value = {}\n')

  await transformFile(sourcePath, 'allocations')
  await writeFile(sourcePath, 'const other = []\n')
  const result = await transformFile(sourcePath, 'allocations')

  expect(result).toBe(`/* allocations:${sourcePath} */\nconst other = []\n`)
  expect(mockTransformCode).toHaveBeenCalledTimes(2)
})

test('transformFile does not share cache across tracking modes', async () => {
  const sourcePath = join(root, 'module.js')
  await mkdir(join(root, 'nested'), { recursive: true })
  await writeFile(sourcePath, 'const value = {}\n')

  await transformFile(sourcePath, 'functions')
  const result = await transformFile(sourcePath, 'allocations')

  expect(result).toBe(`/* allocations:${sourcePath} */\nconst value = {}\n`)
  expect(mockTransformCode).toHaveBeenCalledTimes(2)
})
