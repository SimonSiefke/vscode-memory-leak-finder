import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface ProcessMemoryGrowth {
  readonly afterMemoryKb?: number
  readonly beforeMemoryKb?: number
  readonly deltaMemoryKb?: number
  readonly imageName?: string
  readonly name?: string
  readonly pid?: number
  readonly processName?: string
}

const ignoredProcessNamePrefixes = [
  'applicationframehost',
  'audiodg',
  'backgroundtaskhost',
  'chatgpt',
  'codex',
  'crossdeviceresume',
  'csrss',
  'ctfmon',
  'dwm',
  'explorer',
  'firefox',
  'lsass',
  'memory compression',
  'microsoftstartfeedprovider',
  'mpdefendercoreservice',
  'msedgewebview',
  'ngciso',
  'nissrv',
  'onedrive',
  'registry',
  'runtimebroker',
  'searchhost',
  'searchindexer',
  'searchprotocolhost',
  'securityhealthservice',
  'shellhost',
  'sihost',
  'startmenuexperiencehost',
  'svchost',
  'taskhostw',
  'taskmgr',
  'widgetboard',
  'widgetservice',
  'wmiprvse',
  'wslservice',
]

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const getProcessLabel = (process: ProcessMemoryGrowth): string => {
  const name = process.processName || process.name || process.imageName || 'Unknown process'
  return name.trim() || 'Unknown process'
}

const isIgnoredProcess = (process: ProcessMemoryGrowth): boolean => {
  const normalizedName = getProcessLabel(process)
    .replace(/\.exe$/i, '')
    .toLowerCase()
  return ignoredProcessNamePrefixes.some((prefix) => normalizedName.startsWith(prefix))
}

export const getPoolmonData = async (basePath: string) => {
  const resultsPath = join(basePath, 'poolmon')
  if (!existsSync(resultsPath)) {
    return []
  }

  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const result = await readJson(join(resultsPath, entry.name))
    const poolmonResult = result.poolmon ?? result
    const processMemoryGrowth: readonly ProcessMemoryGrowth[] = poolmonResult.processMemoryGrowth || []
    const leakingProcesses = processMemoryGrowth.filter(
      (process) =>
        !isIgnoredProcess(process) &&
        isFiniteNumber(process.beforeMemoryKb) &&
        isFiniteNumber(process.afterMemoryKb) &&
        isFiniteNumber(process.deltaMemoryKb) &&
        process.deltaMemoryKb > 0,
    )
    const processNames = new Map<string, number>()
    for (const process of leakingProcesses) {
      const name = getProcessLabel(process)
      processNames.set(name, (processNames.get(name) || 0) + 1)
    }
    const data = leakingProcesses
      .map((process) => {
        const processName = getProcessLabel(process)
        const name =
          processNames.get(processName)! > 1 && Number.isInteger(process.pid) ? `${processName} (PID ${process.pid})` : processName
        return {
          count: process.afterMemoryKb!,
          delta: process.deltaMemoryKb!,
          name,
        }
      })
      .sort((a, b) => b.count - a.count || b.delta - a.delta || a.name.localeCompare(b.name))
    results.push({
      data,
      filename: entry.name.slice(0, -'.json'.length),
    })
  }
  return results
}
