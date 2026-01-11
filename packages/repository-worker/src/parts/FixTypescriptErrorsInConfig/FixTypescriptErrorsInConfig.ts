import { computeTsIgnoreOperations } from '../ComputeTsIgnoreOperations/ComputeTsIgnoreOperations.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { parseTscErrors } from '../ParseTscErrors/ParseTscErrors.ts'
import * as Path from '../Path/Path.ts'
import { runTsc } from '../RunTsc/RunTsc.ts'

export const fixTypescriptErrorsInConfig = async (configPath: string): Promise<void> => {
  const cwd = Path.join(configPath, '..')
  console.log(`[repository] Running tsc in ${configPath}...`)
  const result = await runTsc(cwd)
  if (result.exitCode === 0) {
    return
  }
  const output = `${result.stdout}\n${result.stderr}`
  const locations = parseTscErrors(output, cwd)
  if (locations.length === 0) {
    return
  }
  const operations = await computeTsIgnoreOperations(locations)
  if (operations.length === 0) {
    return
  }
  await FileSystemWorker.applyFileOperations(operations)
}
