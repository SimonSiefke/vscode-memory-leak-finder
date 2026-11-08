import { copyFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

export const install = async (copilotHome: string) => {
  const directory = join(copilotHome, 'extensions', 'inbox-contract')
  await mkdir(directory, { recursive: true })
  await rm(join(directory, 'ready'), { recursive: true, force: true })
  await copyFile(new URL('../../../../agents-e2e/fixtures/inbox-canvas/extension.mjs', import.meta.url), join(directory, 'extension.mjs'))
  return {
    directory,
    dispose: () => rm(directory, { recursive: true, force: true }),
  }
}
