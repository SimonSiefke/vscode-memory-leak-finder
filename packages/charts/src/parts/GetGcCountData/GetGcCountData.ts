import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getGcCountData = async (basePath: string, key: 'minorGCs' | 'majorGCs') => {
  const folder = join(basePath, 'gc-statistics')
  if (!existsSync(folder)) return []
  const data: { count: number; index: number; name: string }[] = []
  for (const file of (await readdir(folder)).filter((file) => file.endsWith('.json')).sort()) {
    const result = (await readJson(join(folder, file))).gcStatistics
    const count = result?.metrics?.[key]
    if (result?.raw?.after?.dataLossOccurred || !Number.isInteger(count) || count < 0) continue
    data.push({ count, index: data.length, name: file })
  }
  return data
}
