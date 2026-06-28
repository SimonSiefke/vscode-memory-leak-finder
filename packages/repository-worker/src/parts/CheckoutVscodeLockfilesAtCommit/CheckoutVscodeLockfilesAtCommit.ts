import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import * as os from 'node:os'
import { exec } from '../Exec/Exec.ts'
import * as Path from '../Path/Path.ts'
import * as VerboseLog from '../VerboseLog/VerboseLog.ts'

const sparseCheckoutPatterns = '.nvmrc\n**/package-lock.json\n'

export const checkoutVscodeLockfilesAtCommit = async (repoUrl: string, commitHash: string, verbose: boolean = false): Promise<string> => {
  const temporaryDirectory = await mkdtemp(Path.join(os.tmpdir(), 'vscode-node-modules-cache-key-'))
  const sparseCheckoutPath = Path.join(temporaryDirectory, '.git', 'info', 'sparse-checkout')

  try {
    if (verbose) {
      await VerboseLog.write(`Created temporary checkout at ${temporaryDirectory}.\n`)
      await VerboseLog.write('Initializing temporary Git repository...\n')
    }
    await exec('git', ['-c', 'init.defaultbranch=main', 'init'], { cwd: temporaryDirectory })
    if (verbose) {
      await VerboseLog.write(`Adding remote ${repoUrl}...\n`)
    }
    await exec('git', ['remote', 'add', 'origin', repoUrl], { cwd: temporaryDirectory })
    if (verbose) {
      await VerboseLog.write('Configuring sparse checkout for lockfiles...\n')
    }
    await exec('git', ['sparse-checkout', 'init', '--no-cone'], { cwd: temporaryDirectory })
    await writeFile(sparseCheckoutPath, sparseCheckoutPatterns)
    if (verbose) {
      await VerboseLog.write(`Fetching commit ${commitHash}...\n`)
    }
    await exec('git', ['fetch', '--depth', '1', '--filter=blob:none', 'origin', commitHash], { cwd: temporaryDirectory })
    if (verbose) {
      await VerboseLog.write('Checking out fetched commit...\n')
    }
    await exec('git', ['-c', 'advice.detachedHead=false', 'checkout', 'FETCH_HEAD'], { cwd: temporaryDirectory })
    return temporaryDirectory
  } catch (error) {
    await rm(temporaryDirectory, { force: true, recursive: true })
    throw error
  }
}
