import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getCpuPerformanceCountersData } from '../GetCpuPerformanceCountersData/GetCpuPerformanceCountersData.ts'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getInstructionCountResults = async (basePath: string) => {
  const counters = await getCpuPerformanceCountersData(basePath)
  const rows = counters.map((item) => ({
    name: item.filename,
    value: item.data.find((row) => row.name === 'instructions')?.value ?? null,
  }))
  rows.sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || a.name.localeCompare(b.name))
  const availabilityPath = join(basePath, 'cpu-performance-counters-availability.json')
  const availability = existsSync(availabilityPath) ? await readJson(availabilityPath) : undefined
  return { availability, rows }
}

export const getInstructionCountData = async (basePath: string) => {
  const { availability, rows } = await getInstructionCountResults(basePath)
  if (!rows.length && !availability) return []
  const data = rows.flatMap((row) => (row.value === null ? [] : [{ name: row.name, value: row.value }]))
  return [
    {
      data,
      filename: 'all-tests',
      ...(data.length
        ? {}
        : { status: 'No instruction counts were collected. See the instruction count report for availability details.' }),
    },
  ]
}
