import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { join } from 'node:path'

const goVersion = 'go1.27.0'
const goplsVersion = 'v0.23.0'
const repositoryRoot = join(import.meta.dirname, '..', '..', '..')
const cacheRoot = join(repositoryRoot, '.vscode-tool-downloads', 'go-progress-terminal')

const archives = {
  'darwin-arm64': {
    fileName: `${goVersion}.darwin-arm64.tar.gz`,
    sha256: '90493b3bbd5e10f91d12153198bf1994fd756399b4fec93b49b0c6e2acdeeb3e',
  },
  'darwin-x64': {
    fileName: `${goVersion}.darwin-amd64.tar.gz`,
    sha256: 'd3314e25496e4381d71a5c51d2907e7af655d199f6780b549f015bd85fef4986',
  },
  'linux-arm64': {
    fileName: `${goVersion}.linux-arm64.tar.gz`,
    sha256: '51798d2c42d0e1c6ed7fd9f48728b4193abac9e8aad6dbac2fe96a81f5909bda',
  },
  'linux-x64': {
    fileName: `${goVersion}.linux-amd64.tar.gz`,
    sha256: '675c26c449cbb18fc24b74650de1eabbae6e16f64326fd85a283fb3b58280685',
  },
  'win32-arm64': {
    fileName: `${goVersion}.windows-arm64.zip`,
    sha256: '6e0156b9788209931dd340fadc04171ce15063c17b51c92e7b86b51109626e90',
  },
  'win32-x64': {
    fileName: `${goVersion}.windows-amd64.zip`,
    sha256: 'f0c0a0d33ba94f4d2c5dbc887334ce678b21813504ddb3aafcb06e60a5a667c4',
  },
} as const

const executableName = platform() === 'win32' ? 'go.exe' : 'go'
const goplsExecutableName = platform() === 'win32' ? 'gopls.exe' : 'gopls'

const canExecute = (command: string, args: readonly string[]): boolean => {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  return !result.error && result.status === 0
}

const getSystemGoRoot = (): string | undefined => {
  const versionResult = spawnSync('go', ['version'], { encoding: 'utf8' })
  const match = versionResult.stdout?.match(/\bgo(\d+)\.(\d+)(?:\.\d+)?\b/)
  if (versionResult.error || versionResult.status !== 0 || !match) {
    return undefined
  }
  const major = Number(match[1])
  const minor = Number(match[2])
  if (major < 1 || (major === 1 && minor < 26)) {
    return undefined
  }
  const rootResult = spawnSync('go', ['env', 'GOROOT'], { encoding: 'utf8' })
  if (rootResult.error || rootResult.status !== 0) {
    return undefined
  }
  return rootResult.stdout.trim() || undefined
}

const verifyArchive = async (archivePath: string, expectedSha256: string): Promise<boolean> => {
  try {
    const archive = await readFile(archivePath)
    return createHash('sha256').update(archive).digest('hex') === expectedSha256
  } catch {
    return false
  }
}

const downloadArchive = async (archivePath: string, fileName: string, expectedSha256: string): Promise<void> => {
  const response = await fetch(`https://go.dev/dl/${fileName}`)
  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}: ${response.status} ${response.statusText}`)
  }
  const archive = Buffer.from(await response.arrayBuffer())
  const actualSha256 = createHash('sha256').update(archive).digest('hex')
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Checksum mismatch for ${fileName}: expected ${expectedSha256}, got ${actualSha256}`)
  }
  await writeFile(archivePath, archive)
}

const ensureManagedGoRoot = async (): Promise<string> => {
  const platformKey = `${platform()}-${arch()}` as keyof typeof archives
  const archive = archives[platformKey]
  if (!archive) {
    throw new Error(`No Go ${goVersion} archive configured for ${platformKey}`)
  }

  const goRoot = join(cacheRoot, goVersion)
  const goBinary = join(goRoot, 'bin', executableName)
  if (canExecute(goBinary, ['version'])) {
    return goRoot
  }

  await mkdir(cacheRoot, { recursive: true })
  const archivePath = join(cacheRoot, archive.fileName)
  if (!(await verifyArchive(archivePath, archive.sha256))) {
    await rm(archivePath, { force: true })
    await downloadArchive(archivePath, archive.fileName, archive.sha256)
  }

  const extractionRoot = await mkdtemp(join(cacheRoot, '.extract-'))
  try {
    const extraction = spawnSync('tar', ['-xf', archivePath, '-C', extractionRoot], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })
    if (extraction.error) {
      throw extraction.error
    }
    if (extraction.status !== 0) {
      throw new Error(`Failed to extract ${archive.fileName}: ${extraction.stderr}`)
    }
    await rm(goRoot, { force: true, recursive: true })
    await rename(join(extractionRoot, 'go'), goRoot)
  } finally {
    await rm(extractionRoot, { force: true, recursive: true })
  }
  return goRoot
}

const ensureGopls = async (goBinary: string): Promise<string> => {
  const binDirectory = join(cacheRoot, `gopls-${goplsVersion}`, 'bin')
  const goplsBinary = join(binDirectory, goplsExecutableName)
  if (canExecute(goplsBinary, ['version'])) {
    return goplsBinary
  }

  await mkdir(binDirectory, { recursive: true })
  const installation = spawnSync(goBinary, ['install', `golang.org/x/tools/gopls@${goplsVersion}`], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GOBIN: binDirectory,
      GOCACHE: join(cacheRoot, 'go-build-cache'),
      GOMODCACHE: join(cacheRoot, 'go-module-cache'),
      GOTOOLCHAIN: 'local',
    },
    maxBuffer: 10 * 1024 * 1024,
    timeout: 10 * 60_000,
  })
  if (installation.error) {
    throw installation.error
  }
  if (installation.status !== 0) {
    throw new Error(`Failed to install gopls ${goplsVersion}: ${installation.stderr}`)
  }
  return goplsBinary
}

export const ensureGoToolchain = async (): Promise<{ goBinary: string; goRoot: string; goplsBinary: string }> => {
  const goRoot = getSystemGoRoot() || (await ensureManagedGoRoot())
  const goBinary = join(goRoot, 'bin', executableName)
  await access(goBinary)
  const goplsBinary = await ensureGopls(goBinary)
  return { goBinary, goRoot, goplsBinary }
}
