import { VError } from '@lvce-editor/verror'
import { join } from 'node:path'
import { exec } from '../Exec/Exec.ts'
import * as ReadJson from '../ReadJson/ReadJson.ts'

export const findCommitForVersion = async (repoPath: string, version: string): Promise<string> => {
  try {
    // Get all tags (should already be fetched by caller)
    const allTagsResult = await exec('git', ['tag', '-l'], { cwd: repoPath })
    const tags = allTagsResult.stdout.split('\n').filter((tag) => tag.trim())

    // Try exact match first
    if (tags.includes(version)) {
      const commitResult = await exec('git', ['rev-parse', version], { cwd: repoPath })
      return commitResult.stdout.trim()
    }

    // Try to find a tag that includes the version
    const matchingTag = tags.find((tag) => tag.includes(version))
    if (matchingTag) {
      const commitResult = await exec('git', ['rev-parse', matchingTag], { cwd: repoPath })
      return commitResult.stdout.trim()
    }

    // If no tag found, try to find commit by checking git log
    const logResult = await exec('git', ['log', '--all', '--oneline', '--grep', version], { cwd: repoPath })
    if (logResult.stdout.trim()) {
      const firstLine = logResult.stdout.split('\n')[0]
      const commitHash = firstLine.split(' ')[0]
      if (commitHash) {
        return commitHash
      }
    }

    // Last resort: try to find by package.json content
    const packageJsonPath = join(repoPath, 'package.json')
    try {
      const packageJson = await ReadJson.readJson(packageJsonPath)
      if (packageJson.version === version) {
        // Current commit matches
        const currentCommitResult = await exec('git', ['rev-parse', 'HEAD'], { cwd: repoPath })
        return currentCommitResult.stdout.trim()
      }
    } catch {
      // package.json might not exist or be readable
    }

    throw new Error(`Could not find commit for version ${version}`)
  } catch (error) {
    throw new VError(error, `Failed to find commit for version '${version}'`)
  }
}
