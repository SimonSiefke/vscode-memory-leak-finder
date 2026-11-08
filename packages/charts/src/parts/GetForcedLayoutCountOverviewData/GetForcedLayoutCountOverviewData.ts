import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getForcedLayoutCountOverviewData = async (basePath: string) => {
  const folder = join(basePath, 'forced-layout-count')
  if (!existsSync(folder)) return []
  const data: { count: number; index: number; name: string }[] = []
  for (const file of (await readdir(folder)).filter((file) => file.endsWith('.json')).sort()) {
    const result = (await readJson(join(folder, file))).forcedLayoutCount
    const count = result?.metrics?.forcedLayoutCount
    if (result?.available === false || result?.incomplete || !Number.isInteger(count) || count < 0) continue
    data.push({ count, index: data.length, name: file })
  }
  return data
}
