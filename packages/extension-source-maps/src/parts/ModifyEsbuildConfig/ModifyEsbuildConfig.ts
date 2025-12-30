import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'
import { getNewEsbuildConfig } from '../GetNewEsbuildConfig/GetNewEsbuildConfig.ts'

export const modifyEsbuildConfig = async (repoPath: string): Promise<void> => {
  try {
    const configPath = join(repoPath, '.esbuild.ts')
    const content = await readFile(configPath, 'utf8')
    const newContent = getNewEsbuildConfig(content)

    if (newContent !== content) {
      await writeFile(configPath, newContent, 'utf8')
    }
  } catch (error) {
    throw new VError(error, `Failed to modify esbuild config in '${repoPath}'`)
  }
}
