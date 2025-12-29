import { expect, test } from '@jest/globals'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { getNodeVersion } from '../src/parts/GetNodeVersion/GetNodeVersion.ts'

test('getNodeVersion - extracts version from engines.node', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '>=18.0.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('18.0.0')
})

test('getNodeVersion - handles version without patch', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '>=20.5',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('20.5.0')
})

test('getNodeVersion - handles version with only major', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '18',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('18.0.0')
})

test('getNodeVersion - throws error when engines.node is missing', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {}
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  await expect(getNodeVersion(tempDir)).rejects.toThrow('No node version specified in package.json engines')
})

test('getNodeVersion - throws error when engines is missing', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    name: 'test',
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  await expect(getNodeVersion(tempDir)).rejects.toThrow('No node version specified in package.json engines')
})

test('getNodeVersion - throws error when version cannot be parsed', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: 'invalid-version',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  await expect(getNodeVersion(tempDir)).rejects.toThrow('Could not parse node version from: invalid-version')
})

test('getNodeVersion - handles exact version', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '20.10.5',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('20.10.5')
})

test('getNodeVersion - handles version with tilde', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const packageJson = {
    engines: {
      node: '~18.5.0',
    },
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const version = await getNodeVersion(tempDir)
  expect(version).toBe('18.5.0')
})

test('getNodeVersion - throws VError when package.json does not exist', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await expect(getNodeVersion(tempDir)).rejects.toThrow("Failed to get node version from '")
})

test('getNodeVersion - throws VError when package.json is invalid JSON', async () => {
  const tempDir = join(tmpdir(), `test-get-node-version-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  await writeFile(join(tempDir, 'package.json'), 'invalid json')

  await expect(getNodeVersion(tempDir)).rejects.toThrow("Failed to get node version from '")
})
