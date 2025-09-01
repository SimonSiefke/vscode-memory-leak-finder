import { VError } from '@lvce-editor/verror'
import { findTsConfigFiles } from '../FindTsConfigFiles/FindTsConfigFiles.ts'
import { fixTypescriptErrorsInConfig } from '../FixTypescriptErrorsInConfig/FixTypescriptErrorsInConfig.ts'
import { launchFileSystemWorker } from '../LaunchFileSystemWorker/LaunchFileSystemWorker.ts'
import { dispose } from '../FileSystemWorker/FileSystemWorker.ts'

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

await launchFileSystemWorker()
await fixTypescriptErrors(`/workspace/vscode-memory-leak-finder/.vscode-repos`)
await dispose()
