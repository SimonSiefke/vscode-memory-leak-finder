import { VError } from '@lvce-editor/verror'
import { findTsConfigFiles } from '../FindTsConfigFiles/FindTsConfigFiles.ts'
import { fixTypescriptErrorsInConfig } from '../FixTypescriptErrorsInConfig/FixTypescriptErrorsInConfig.ts'

export const fixTypescriptErrors = async (repoPath: string): Promise<void> => {
  try {
    const configs = await findTsConfigFiles(repoPath)
    for (const configPath of configs) {
      await fixTypescriptErrorsInConfig(configPath)
    }
  } catch (error) {
    throw new VError(error, 'Failed to fix TypeScript errors')
  }
}
