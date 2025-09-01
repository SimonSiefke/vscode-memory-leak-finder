import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../Path/Path.ts'
import { findTsConfigFiles } from '../FindTsConfigFiles/FindTsConfigFiles.ts'
import { runTsc } from '../RunTsc/RunTsc.ts'
import { parseTscErrors } from '../ParseTscErrors/ParseTscErrors.ts'
import { computeTsIgnoreOperations } from '../ComputeTsIgnoreOperations/ComputeTsIgnoreOperations.ts'

export const fixTypescriptErrors = async (repoPath: string): Promise<void> => {
  try {
    const configs = await findTsConfigFiles(repoPath)
    if (configs.length === 0) {
      return
    }
    for (const configPath of configs) {
      const cwd = Path.join(configPath, '..')
      const result = await runTsc(cwd)
      if (result.exitCode === 0) {
        continue
      }
      const output = `${result.stdout}\n${result.stderr}`
      const locations = parseTscErrors(output, cwd)
      if (locations.length === 0) {
        continue
      }
      const operations = await computeTsIgnoreOperations(locations)
      if (operations.length === 0) {
        continue
      }
      await FileSystemWorker.applyFileOperations(operations)
    }
  } catch (error) {
    throw new VError(error, 'Failed to fix TypeScript errors')
  }
}


