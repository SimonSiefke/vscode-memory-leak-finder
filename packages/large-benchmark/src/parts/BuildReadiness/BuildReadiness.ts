import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { readJson, writeJson, errorMessage } from '../Io/Io.ts'
import type { executionPlan } from '../Architecture/Architecture.ts'
import type { Architecture } from '../Types/Types.ts'

type Matrix = ReturnType<typeof executionPlan>['matrix']
interface BuildStatus {
  status: string
  commit: string
  arch: string
  artifactUploaded?: boolean
  error?: string
}

export const recordBuildUpload = async (directory: string, commit: string, uploaded: boolean): Promise<void> => {
  const status = await readJson<BuildStatus>(join(directory, 'status.json')).catch(() => ({
    status: 'failed',
    commit,
    arch: process.arch,
    error: 'Build did not write its status',
  }))
  await writeJson(join(directory, 'status.json'), {
    ...status,
    status: status.status === 'success' && uploaded ? 'success' : 'failed',
    artifactUploaded: uploaded,
    ...(!uploaded && !status.error ? { error: 'Executable package artifact was not uploaded' } : {}),
  })
}

export const readyBuildMatrix = async (matrix: Matrix, input: string, arch: Architecture) => {
  const successful = new Set<string>()
  const diagnostics: string[] = []
  for (const entry of await readdir(input, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory() || !entry.name.startsWith('large-build-status-')) continue
    try {
      const status = await readJson<BuildStatus>(join(input, entry.name, 'status.json'))
      if (!status.commit || !status.arch) throw new Error('Missing commit or architecture')
      if (status.arch !== arch) continue
      const commit = parseCommitReference(status.commit).reference
      if (status.status === 'success' && status.artifactUploaded === true) successful.add(commit)
      else diagnostics.push(`${commit}: ${status.error ?? 'Build or archive upload did not succeed'}`)
    } catch (error) {
      diagnostics.push(`${entry.name}: ${errorMessage(error)}`)
    }
  }
  const ready = matrix.include.filter((job) => successful.has(job.before) && successful.has(job.after))
  const skipped = matrix.include.filter((job) => !ready.includes(job))
  for (const commit of new Set(skipped.flatMap((job) => [job.before, job.after]).filter((commit) => !successful.has(commit))))
    diagnostics.push(`${arch} build unavailable: ${commit}`)
  return { matrix: { include: ready }, successful: [...successful], skipped, diagnostics }
}
