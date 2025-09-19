import type { TestContext } from '../types.ts'

// @ts-ignore
import path, { dirname, join } from 'node:path'
// @ts-ignore
import { fileURLToPath } from 'node:url'

export const skip = true

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url))

const root = path.join(__dirname, '../../../')

const extensionPath = join(root, 'packages', 'e2e', 'fixtures', 'sample.status-bar-item')

export const extraLaunchArgs = [`--extensionDevelopmentPath=${extensionPath}`]

export const run = async ({ StatusBar }: TestContext): Promise<void> => {
  const counter = await StatusBar.item('test.status-bar-sample')
  await counter.shouldHaveText('0')
  await counter.click()
  await counter.shouldHaveText('1')
  await counter.click()
  await counter.shouldHaveText('2')
  await counter.click()
  await counter.shouldHaveText('1')
  await counter.click()
  await counter.shouldHaveText('0')
}
