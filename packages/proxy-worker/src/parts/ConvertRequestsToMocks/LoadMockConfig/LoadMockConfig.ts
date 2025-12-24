import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { MockConfigEntry } from '../../MockConfigEntry/MockConfigEntry.ts'

const __dirname = import.meta.dirname
const MOCK_CONFIG_PATH = join(__dirname, '..', '..', 'GetMockFileName', 'mock-config.json')

export const loadMockConfig = async (): Promise<MockConfigEntry[]> => {
  try {
    if (!existsSync(MOCK_CONFIG_PATH)) {
      return []
    }
    const configContent = await readFile(MOCK_CONFIG_PATH, 'utf8')
    return JSON.parse(configContent) as MockConfigEntry[]
  } catch (error) {
    console.error(`Error loading mock config from ${MOCK_CONFIG_PATH}:`, error)
    return []
  }
}
