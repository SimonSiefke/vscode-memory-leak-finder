import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command, writeJson } from '../Io/Io.ts'
import type { BuildMetadata } from '../Types/Types.ts'

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..')

export const sha256 = async (path: string): Promise<string> => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

export const prepareBuild = async (commit: string, output: string): Promise<BuildMetadata> => {
  if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('Large performance builds require Linux x64')
  if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error('A full 40-character commit SHA is required')
  output = resolve(output)
  await mkdir(output, { recursive: true })
  const sha = commit.toLowerCase()
  await command(
    process.execPath,
    [
      join(repositoryRoot, 'packages/cli/bin/test.js'),
      '--commit',
      sha,
      '--build-vscode-minified',
      '--setup-only',
      '--only',
      'base',
      '--cwd',
      'packages/e2e',
    ],
    { cwd: repositoryRoot, timeout: 5 * 60 * 60 * 1000, inherit: true },
  )
  const buildPath = join(repositoryRoot, '.vscode-repos', `${sha}-minified`, 'VSCode-linux-x64')
  await access(join(buildPath, 'code-oss'))
  // Verify the checkout rather than relying on a pre-existing executable alone.
  const actualCommit = await command('git', ['rev-parse', 'HEAD'], { cwd: join(dirname(buildPath), 'source') })
  if (actualCommit !== sha) throw new Error(`Build checkout is ${actualCommit}, expected ${sha}`)
  const archive = join(output, 'vscode.tar.gz')
  await command('tar', ['-czf', archive, '-C', dirname(buildPath), 'VSCode-linux-x64'], { timeout: 300000 })
  const metadata: BuildMetadata = {
    schemaVersion: 1,
    commit: sha,
    platform: 'linux',
    arch: 'x64',
    executable: 'VSCode-linux-x64/code-oss',
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
    metadata.commit !== expectedCommit.toLowerCase() ||
    metadata.platform !== 'linux' ||
    metadata.arch !== 'x64' ||
    metadata.executable !== 'VSCode-linux-x64/code-oss'
  )
    throw new Error('Build metadata does not match the requested commit/platform')
  const archive = join(directory, 'vscode.tar.gz')
  if ((await sha256(archive)) !== metadata.archiveSha256) throw new Error('VS Code build archive checksum mismatch')
  await command('tar', ['-xzf', archive, '-C', directory], { timeout: 300000 })
  const executable = resolve(directory, metadata.executable)
  await access(executable)
  return executable
}
