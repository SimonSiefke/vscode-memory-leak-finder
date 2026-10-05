import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getWorkbenchPath } from '../src/parts/GetWorkbenchPath/GetWorkbenchPath.js'

test('GetWorkbenchPath - resolves packaged linux executable path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'function-tracker-workbench-'))
  try {
    const binaryPath = join(root, 'VSCode-linux-x64', 'code')
    const workbenchPath = join(root, 'VSCode-linux-x64', 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
    await mkdir(join(root, 'VSCode-linux-x64', 'resources', 'app', 'out', 'vs', 'workbench'), { recursive: true })
    await writeFile(binaryPath, '')
    await writeFile(workbenchPath, '')

    expect(getWorkbenchPath(binaryPath)).toBe(workbenchPath)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('GetWorkbenchPath - resolves source checkout launched through scripts/code.sh', async () => {
  const root = await mkdtemp(join(tmpdir(), 'function-tracker-workbench-'))
  try {
    const binaryPath = join(root, 'vscode', 'scripts', 'code.sh')
    const workbenchPath = join(root, 'vscode', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
    await mkdir(join(root, 'vscode', 'scripts'), { recursive: true })
    await mkdir(join(root, 'vscode', 'out', 'vs', 'workbench'), { recursive: true })
    await writeFile(binaryPath, '')
    await writeFile(workbenchPath, '')

    expect(getWorkbenchPath(binaryPath)).toBe(workbenchPath)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('GetWorkbenchPath - reports all attempted paths when workbench file is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'function-tracker-workbench-'))
  try {
    const binaryPath = join(root, 'vscode', 'scripts', 'code.sh')
    await mkdir(join(root, 'vscode', 'scripts'), { recursive: true })
    await writeFile(binaryPath, '')

    expect(() => getWorkbenchPath(binaryPath)).toThrow(
      [
        'Failed to find workbench.desktop.main.js. Tried:',
        join(root, 'vscode', 'scripts', 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
        join(root, 'vscode', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
        join(root, 'vscode', 'scripts', 'code.sh', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
      ].join('\n'),
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
