import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preserveCopilotRuntime } from '../CopilotRuntime/CopilotRuntime.ts'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { command, writeJson } from '../Io/Io.ts'
import type { BuildMetadata } from '../Types/Types.ts'

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..')

export const sha256 = async (path: string): Promise<string> => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

export const prepareBuild = async (commit: string, output: string): Promise<BuildMetadata> => {
  if (process.platform !== 'linux' || !['x64', 'arm64'].includes(process.arch))
    throw new Error('Large performance builds require native Linux x64 or arm64')
  const arch = process.arch as BuildMetadata['arch']
  const packageDirectory = `VSCode-linux-${arch}`
  const { reference, sha, buildReference } = parseCommitReference(commit)
  output = resolve(output)
  await mkdir(output, { recursive: true })
  await command(
    process.execPath,
    [
      join(repositoryRoot, 'packages/cli/bin/test.js'),
      '--commit',
      buildReference,
      '--build-vscode-minified',
      // Each Actions job builds one revision; caching duplicates a multi-GB tree on the same disk.
      '--disable-vscode-node-modules-cache',
      '--setup-only',
      '--only',
      'base',
      '--cwd',
      'packages/e2e',
    ],
    { cwd: repositoryRoot, timeout: 5 * 60 * 60 * 1000, inherit: true },
  )
  const buildPath = join(repositoryRoot, '.vscode-repos', `${sha}-minified`, packageDirectory)
  await access(join(buildPath, 'code-oss'))
  // Verify the checkout rather than relying on a pre-existing executable alone.
  const actualCommit = await command('git', ['rev-parse', 'HEAD'], { cwd: join(dirname(buildPath), 'source') })
  if (actualCommit !== sha) throw new Error(`Build checkout is ${actualCommit}, expected ${sha}`)
  await preserveCopilotRuntime(join(dirname(buildPath), 'source'), buildPath)
  const archive = join(output, 'vscode.tar.gz')
  await command('tar', ['-czf', archive, '-C', dirname(buildPath), packageDirectory], { timeout: 300000 })
  const metadata: BuildMetadata = {
    schemaVersion: 1,
    commit: reference,
    platform: 'linux',
    arch,
    executable: `${packageDirectory}/code-oss`,
    archiveSha256: await sha256(archive),
    nodeVersion: process.version,
    generatedAt: new Date().toISOString(),
  }
  await writeJson(join(output, 'build.json'), metadata)
  await writeJson(join(output, 'status.json'), { status: 'success', ...metadata })
  return metadata
}

export const extractBuild = async (directory: string, expectedCommit: string): Promise<string> => {
  const metadata = JSON.parse(await readFile(join(directory, 'build.json'), 'utf8')) as BuildMetadata
  if (
    metadata.schemaVersion !== 1 ||
    metadata.commit !== parseCommitReference(expectedCommit).reference ||
    metadata.platform !== 'linux' ||
    metadata.arch !== process.arch ||
    !['x64', 'arm64'].includes(metadata.arch) ||
    metadata.executable !== `VSCode-linux-${metadata.arch}/code-oss`
  )
    throw new Error('Build metadata does not match the requested commit/platform')
  const archive = join(directory, 'vscode.tar.gz')
  if ((await sha256(archive)) !== metadata.archiveSha256) throw new Error('VS Code build archive checksum mismatch')
  await command('tar', ['-xzf', archive, '-C', directory], { timeout: 300000 })
  const executable = resolve(directory, metadata.executable)
  await access(executable)
  return executable
}
