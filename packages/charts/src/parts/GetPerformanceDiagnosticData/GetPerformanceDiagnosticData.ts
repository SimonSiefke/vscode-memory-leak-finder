import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Keep counts, milliseconds and ratios in separate charts, preserving each run.
export const getData = async (basePath: string, folder: string, id: string): Promise<any[]> => {
  const path = join(basePath, folder)
  if (!existsSync(path)) return []
  const charts: any[] = []
  for (const file of (await readdir(path)).filter((file) => file.endsWith('.json')).sort()) {
    const result = JSON.parse(await readFile(join(path, file), 'utf8'))[id]
    if (!result) continue
    const status = result.available === false ? 'unavailable' : result.incomplete ? 'incomplete' : ''
    const groups = new Map<string, { name: string; value: number }[]>()
    const add = (group: string, name: string, value: unknown) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return
      const rows = groups.get(group) || []
      rows.push({ name, value })
      groups.set(group, rows)
    }
    if (result.available !== false) {
      for (const [key, value] of Object.entries(result.metrics || {})) {
        const unit = key.endsWith('Ms') ? 'ms' : key.endsWith('Ratio') ? 'ratio' : 'count'
        add(unit, `${key} (${unit})`, value)
      }
      for (const row of result.rows || []) {
        add('locations-count', `${row.name} (count)`, row.count)
        add('locations-ms', `${row.name} (ms)`, row.durationMs)
      }
    }
    if (groups.size === 0) groups.set(status || 'empty', [])
    for (const [group, data] of groups) {
      charts.push({
        filename: `${file.slice(0, -5)}-${group}${status ? `-${status}` : ''}`,
        status:
          result.available === false
            ? `Unavailable: ${result.reason || 'No supported collector'}`
            : data.length
              ? undefined
              : 'No observations',
        omittedEntryCount: Math.max(0, data.length - 30),
        data: data.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, 30),
      })
    }
  }
  return charts
}
