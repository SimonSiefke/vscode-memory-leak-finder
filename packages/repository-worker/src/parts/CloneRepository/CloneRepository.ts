import { VError } from '@lvce-editor/verror'
import { mkdir } from 'node:fs/promises'
import { exec } from '../Exec/Exec.ts'


export const cloneRepository = async (repoUrl:string, repoPath:string, commit:string):Promise<void> => {
  try {
    await mkdir(repoPath, {recursive:true})
    await exec('git', ['-c',  'init.defaultbranch=main', 'init'], {cwd: repoPath})
    await exec('git', ['remote', 'add', 'origin', repoUrl], {cwd:repoPath})
    await exec('git',['fetch', '--depth', '1', 'origin', commit], {cwd:repoPath})
    await exec('git',['-c', 'advice.detachedHead=false', 'checkout', 'FETCH_HEAD'], {cwd:repoPath})
  } catch (error) {
    throw new VError(error, `Failed to clone repository from '${repoUrl}' to '${repoPath}'`)
  }
}
