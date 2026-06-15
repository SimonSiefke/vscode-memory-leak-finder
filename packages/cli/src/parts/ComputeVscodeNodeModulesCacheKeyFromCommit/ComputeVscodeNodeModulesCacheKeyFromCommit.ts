import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const computeVscodeNodeModulesCacheKeyFromCommit = async (commitRef: string, verbose: boolean = false): Promise<void> => {
  if (!commitRef) {
    throw new Error('--commit is required when --compute-vscode-node-modules-cache-key is used')
  }
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  if (verbose) {
    await Stdout.write(`Resolving node modules cache key for VS Code ref '${commitRef}'...\n`)
  }
  await using rpc = await RepositoryWorker.launch()
  const cacheKey = await rpc.invoke('Repository.computeVscodeNodeModulesCacheKeyFromCommit', commitRef, repoUrl, verbose)
  if (verbose) {
    await Stdout.write('Finished computing VS Code node modules cache key.\n')
  }
  await Stdout.write(`${cacheKey}\n`)
}
