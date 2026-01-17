import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'

export const writeFunctionStatistics = async (resultsPath: string): Promise<void> => {
  const functionStats = await getFunctionStatistics()
  await mkdir(dirname(resultsPath), { recursive: true })
  await writeFile(resultsPath, JSON.stringify(functionStats, null, 2) + '\n')
}
