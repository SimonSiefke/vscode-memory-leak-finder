import { beforeEach, expect, jest, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mockTransformCode = jest.fn<(code: string, options: { readonly trackingMode?: string }) => Promise<string>>()

jest.unstable_mockModule('../src/parts/Transform/Transform.ts', () => ({
  transformCode: mockTransformCode,
}))

const { preGenerateWorkbench } = await import('../src/parts/PreGenerateWorkbench/PreGenerateWorkbench.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockTransformCode.mockImplementation(async (code, options) => `/* ${options.trackingMode} */\n${code}`)
})

const createSourceCheckout = async () => {
  const root = await mkdtemp(join(tmpdir(), 'function-tracker-pregenerate-'))
  const repoPath = join(root, 'vscode')
  const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
  const workbenchPath = join(repoPath, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  const outputPath = join(root, 'tracked', 'workbench.desktop.main.js')
  await mkdir(join(repoPath, 'scripts'), { recursive: true })
  await mkdir(join(repoPath, 'out', 'vs', 'workbench'), { recursive: true })
  await writeFile(codeScriptPath, '')
  await writeFile(workbenchPath, 'const first = {}\n')
  return {
    codeScriptPath,
    outputPath,
    root,
    workbenchPath,
  }
}

test('preGenerateWorkbench reuses cache when source metadata is unchanged', async () => {
  const { codeScriptPath, outputPath, root } = await createSourceCheckout()
  try {
    await preGenerateWorkbench(codeScriptPath, outputPath, 'allocations')
    await preGenerateWorkbench(codeScriptPath, outputPath, 'allocations')

    expect(mockTransformCode).toHaveBeenCalledTimes(1)
    expect(await readFile(outputPath, 'utf8')).toBe('/* allocations */\nconst first = {}\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preGenerateWorkbench regenerates when source metadata changes', async () => {
  const { codeScriptPath, outputPath, root, workbenchPath } = await createSourceCheckout()
  try {
    await preGenerateWorkbench(codeScriptPath, outputPath, 'allocations')
    await writeFile(workbenchPath, 'const second = { value: true }\n')
    await preGenerateWorkbench(codeScriptPath, outputPath, 'allocations')

    expect(mockTransformCode).toHaveBeenCalledTimes(2)
    expect(await readFile(outputPath, 'utf8')).toBe('/* allocations */\nconst second = { value: true }\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preGenerateWorkbench regenerates when tracking mode changes', async () => {
  const { codeScriptPath, outputPath, root } = await createSourceCheckout()
  try {
    await preGenerateWorkbench(codeScriptPath, outputPath, 'functions')
    await preGenerateWorkbench(codeScriptPath, outputPath, 'allocations')

    expect(mockTransformCode).toHaveBeenCalledTimes(2)
    expect(await readFile(outputPath, 'utf8')).toBe('/* allocations */\nconst first = {}\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
