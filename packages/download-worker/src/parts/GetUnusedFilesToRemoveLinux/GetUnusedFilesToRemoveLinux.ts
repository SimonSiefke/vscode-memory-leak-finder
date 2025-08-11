import { join, resolve } from 'node:path'
import { readdir } from 'node:fs/promises'

export const getUnusedFilesToRemoveLinux = async (binaryPath: string): Promise<readonly string[]> => {
  const files: string[] = []
  const installDir = resolve(binaryPath, '..')
  const appRoot = join(installDir, 'resources', 'app')
  const localesDir = join(installDir, 'locales')

  // locales except en-US
  try {
    const entries = await readdir(localesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue
      }
      if (entry.name.endsWith('.pak') && entry.name !== 'en-US.pak') {
        files.push(join(localesDir, entry.name))
      }
    }
  } catch {}

  // bin folder
  files.push(join(installDir, 'bin'))

  // licenses
  files.push(join(installDir, 'licenses'))
  files.push(join(installDir, 'ThirdPartyNotices.txt'))
  files.push(join(installDir, 'LICENSES.chromium.html'))

  // vsce-sign artifacts
  const possibleVsceBases = [join(appRoot, 'node_modules', '@vscode'), join(appRoot, 'node_modules.asar.unpacked', '@vscode')]
  for (const base of possibleVsceBases) {
    try {
      const entries = await readdir(base, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('vsce-sign')) {
          files.push(join(base, entry.name))
        }
      }
    } catch {}
  }

  return files
}
