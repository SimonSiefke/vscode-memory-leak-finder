export const skip = true

import { readdir } from 'fs/promises'

export const beforeSetup = async ({ tmpDir, writeFile, join, writeSettings }) => {
  for (let i = 0; i < 3; i++) {
    const path = join(tmpDir, `file-${i}.txt`)
    await writeFile(path, ``)
  }
  await writeSettings({
    'window.titleBarStyle': 'custom',
    'files.watcherExclude': {
      '**/**': true,
    },
  })
}

const RE_NUMBER = /\d+/

export const run = async ({ Explorer, page, expect, writeFile, join, tmpDir, rm }) => {
  const header = page.locator(`.pane-header[aria-label^="Explorer Section"]`)
  await expect(header).toBeVisible()
  await header.hover()
  const dirents = await readdir(tmpDir)
  const last = dirents.at(-1)
  if (!last) {
    throw new Error('last must be defined')
  }
  const numberMatch = last.match(RE_NUMBER)
  if (!numberMatch) {
    throw new Error('last must match a number')
  }
  const number = parseInt(numberMatch[0])
  const nextNumber = number + 1
  const nextFileName = `file-${nextNumber}.txt`
  const nextPath = join(tmpDir, nextFileName)
  await writeFile(nextPath, ``)
  const button = page.locator(`[role="button"][aria-label="Refresh Explorer"]`)
  await button.click()
  await Explorer.shouldHaveItem(nextFileName)
  await rm(nextPath)
  await button.click()
  await Explorer.not.toHaveItem(nextFileName)
}
