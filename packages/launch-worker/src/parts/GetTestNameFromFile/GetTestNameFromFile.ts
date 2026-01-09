import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const TEST_NAME_FILE = join(Root.root, '.vscode-test-name.txt')

export const getTestNameFromFile = (): string | null => {
  try {
    if (existsSync(TEST_NAME_FILE)) {
      const testName = readFileSync(TEST_NAME_FILE, 'utf8').trim()
      return testName || null
    }
  } catch (error) {
    // Ignore errors
  }
  return null
}

export const setTestNameToFile = (testName: string | null): void => {
  try {
    if (testName) {
      writeFileSync(TEST_NAME_FILE, testName, 'utf8')
    } else {
      if (existsSync(TEST_NAME_FILE)) {
        unlinkSync(TEST_NAME_FILE)
      }
    }
  } catch (error) {
    // Ignore errors
  }
}
