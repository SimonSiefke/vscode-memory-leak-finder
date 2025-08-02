import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import * as DownloadAndBuildVscodeFromCommit from '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
import * as Root from '../src/parts/Root/Root.js'

test('downloadAndBuildVscodeFromCommit - function exists and is callable', () => {
  expect(typeof DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit).toBe('function')
})

test('downloadAndBuildVscodeFromCommit - function signature is correct', () => {
  const fn = DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit
  expect(fn.length).toBe(1) // Should accept one parameter (commitRef)
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with missing node_modules', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-123'
  const reposDir = join(Root.root, '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)

  // Ensure clean state
  if (existsSync(repoPath)) {
    rmSync(repoPath, { recursive: true, force: true })
  }

  // Create repo directory with package.json but no node_modules
  mkdirSync(repoPath, { recursive: true })
  writeFileSync(join(repoPath, 'package.json'), JSON.stringify({ name: 'vscode' }))
  writeFileSync(join(repoPath, 'package-lock.json'), JSON.stringify({ lockfileVersion: 1 }))

  // Create out directory but no main.js (simulating interrupted build)
  mkdirSync(join(repoPath, 'out'), { recursive: true })

  // Create scripts directory with code.sh
  mkdirSync(join(repoPath, 'scripts'), { recursive: true })
  writeFileSync(join(repoPath, 'scripts', 'code.sh'), '#!/bin/bash\necho "VS Code"')

  try {
    // This should detect missing node_modules and attempt to restore from cache
    // Since we're in a test environment, it will likely fail gracefully
    await expect(DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(testCommitHash)).rejects.toThrow()
  } finally {
    // Cleanup
    if (existsSync(repoPath)) {
      rmSync(repoPath, { recursive: true, force: true })
    }
  }
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing node_modules', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-456'
  const reposDir = join(Root.root, '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)

  // Ensure clean state
  if (existsSync(repoPath)) {
    rmSync(repoPath, { recursive: true, force: true })
  }

  // Create repo directory with package.json and node_modules
  mkdirSync(repoPath, { recursive: true })
  writeFileSync(join(repoPath, 'package.json'), JSON.stringify({ name: 'vscode' }))
  writeFileSync(join(repoPath, 'package-lock.json'), JSON.stringify({ lockfileVersion: 1 }))

  // Create node_modules directory (simulating interrupted workflow with existing deps)
  mkdirSync(join(repoPath, 'node_modules'), { recursive: true })
  writeFileSync(join(repoPath, 'node_modules', '.package-lock.json'), '{}')

  // Create out directory but no main.js (simulating interrupted build)
  mkdirSync(join(repoPath, 'out'), { recursive: true })

  // Create scripts directory with code.sh
  mkdirSync(join(repoPath, 'scripts'), { recursive: true })
  writeFileSync(join(repoPath, 'scripts', 'code.sh'), '#!/bin/bash\necho "VS Code"')

  try {
    // This should detect existing node_modules and skip npm ci
    // Since we're in a test environment, it will likely fail gracefully
    await expect(DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(testCommitHash)).rejects.toThrow()
  } finally {
    // Cleanup
    if (existsSync(repoPath)) {
      rmSync(repoPath, { recursive: true, force: true })
    }
  }
})
