import { compareHeapsnapshotArraysInternal2 } from '../CompareHeapsnapshotArraysInternal2/CompareHeapsnapshotArraysInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { dirname, join, resolve } from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

interface ScriptInfo {
  readonly url?: string
  readonly sourceMapUrl?: string
}

const loadScriptMaps = async (): Promise<Record<number, ScriptInfo>> => {
  const scriptMap: Record<number, ScriptInfo> = Object.create(null)
  try {
    const thisDir: string = dirname(fileURLToPath(import.meta.url))
    const packageDir: string = resolve(thisDir, '../../..')
    const repoRoot: string = resolve(packageDir, '../..')
    const scriptMapsDir: string = join(repoRoot, '.vscode-script-maps')
    const entries = await readdir(scriptMapsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const fullPath = join(scriptMapsDir, entry.name)
        try {
          const content = await readFile(fullPath, 'utf8')
          const parsed = JSON.parse(content) as Record<string, ScriptInfo>
          for (const [key, value] of Object.entries(parsed)) {
            const numericKey = Number(key)
            const existing = scriptMap[numericKey]
            if (!existing) {
              scriptMap[numericKey] = value
            } else {
              // Prefer entries with sourceMapUrl
              if (!existing.sourceMapUrl && value.sourceMapUrl) {
                scriptMap[numericKey] = value
              }
            }
          }
        } catch {
          // ignore invalid files
        }
      }
    }
  } catch {
    // ignore if directory not found
  }
  return scriptMap
}

export const compareHeapsnapshotArrays2 = async (pathA: string, pathB: string) => {
  const [snapshotA, snapshotB, scriptMap] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
    loadScriptMaps(),
  ])
  return compareHeapsnapshotArraysInternal2(snapshotA, snapshotB, scriptMap)
}
