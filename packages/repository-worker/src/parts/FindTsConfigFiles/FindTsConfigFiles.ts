import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../Path/Path.ts'

export const findTsConfigFiles = async (rootDir: string): Promise<readonly string[]> => {
  try {
    const relativePaths = await FileSystemWorker.findFiles('**/tsconfig.json', {
      cwd: rootDir,
      exclude: ['**/node_modules/**', '**/out/**', '**/.git/**'],
    })
    return relativePaths.map((p) => Path.join(rootDir, p))
  } catch (error) {
    throw new VError(error, `Failed to find tsconfig files in directory '${rootDir}'`)
  }
}
