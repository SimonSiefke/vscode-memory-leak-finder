import assert from 'node:assert/strict'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'

let userDataPath = ''
let originalSettings: string | undefined

const getSettingsPath = (): string => join(userDataPath, 'User', 'settings.json')

const getBackupsPath = (): string => join(userDataPath, 'Backups')

const readBackupContents = async (directory: string): Promise<string[]> => {
  let entries
  try {
    entries = await readdir(directory, { recursive: true, withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
  const contents: string[] = []
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }
    try {
      contents.push(await readFile(join(entry.parentPath, entry.name), 'utf8'))
    } catch (error) {
      // A backup can be discarded between listing and reading it.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }
  return contents
}

/**
 * The harness defaults to `files.hotExit: "off"`, which makes a dirty reload
 * prompt instead of backing up. Hot exit is application scoped, so it must be
 * enabled in user settings. The minimap canary is written in the same file so
 * its visibility proves the configuration change reached the workbench.
 * Requires a visible text editor.
 */
export const enable = async ({ Editor, Electron }: TestContext): Promise<void> => {
  const userData = await Electron.evaluate('globalThis._____electron.app.getPath("userData")')
  assert.equal(typeof userData, 'string')
  userDataPath = userData as string
  const settings = await readFile(getSettingsPath(), 'utf8')
  await Editor.shouldNotHaveMinimap()
  originalSettings = settings
  await writeFile(
    getSettingsPath(),
    JSON.stringify({ ...JSON.parse(settings), 'editor.minimap.enabled': true, 'files.hotExit': 'onExit' }, null, 2) + '\n',
  )
  await Editor.shouldHaveMinimap()
}

/**
 * Writes the original user settings back and waits for the minimap canary to
 * disappear. Requires a visible text editor.
 */
export const restore = async ({ Editor }: TestContext): Promise<void> => {
  if (originalSettings === undefined) {
    return
  }
  const settings = originalSettings
  originalSettings = undefined
  await writeFile(getSettingsPath(), settings)
  await Editor.shouldNotHaveMinimap()
}

/**
 * Polls the user data `Backups` folder until every marker is (or is no longer)
 * contained in a backup file. Searches by content, not by backup layout.
 */
export const waitForBackups = async (markers: readonly string[], { present }: { readonly present: boolean }): Promise<void> => {
  assert.ok(userDataPath, 'Hot exit settings are not enabled')
  const deadline = Date.now() + 15_000
  while (true) {
    const contents = await readBackupContents(getBackupsPath())
    const pending = markers.filter((marker) => contents.some((content) => content.includes(marker)) !== present)
    if (pending.length === 0) {
      return
    }
    if (Date.now() >= deadline) {
      throw new Error(`Expected backups ${present ? 'to contain' : 'not to contain'} ${pending.join(', ')}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
