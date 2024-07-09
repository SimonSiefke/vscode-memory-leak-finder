// @ts-ignore
import path, { dirname, join } from 'node:path'
// @ts-ignore
import { fileURLToPath } from 'node:url'

export const skip = true

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url))

const root = path.join(__dirname, '../../../')

const extensionPath = join(root, 'packages', 'e2e', 'fixtures', 'sample.show-notification')

export const extraLaunchArgs = [`--extensionDevelopmentPath=${extensionPath}`]

export const run = async ({ QuickPick }) => {
  await QuickPick.show()
  await QuickPick.select('Hello World')
}
