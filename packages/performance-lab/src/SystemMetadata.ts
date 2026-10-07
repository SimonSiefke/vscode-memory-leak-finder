import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { cpus, freemem, hostname, loadavg, platform, release, totalmem, uptime } from 'node:os'
import { dirname, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const readJson = async (path: string): Promise<any | undefined> => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return undefined
  }
}

const readText = async (path: string): Promise<string> => {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}

const getProcStat = async () => {
  const cpuLine = (await readText('/proc/stat')).split('\n')[0] || ''
  const values = cpuLine
    .trim()
    .split(/\s+/)
    .slice(1)
    .map((value) => Number(value) || 0)
  const status = await readText('/proc/self/status')
  const allowed = /^Cpus_allowed_list:\s*(.+)$/m.exec(status)?.[1] || ''
  return {
    cpuAffinity: allowed,
    cpuJiffies: {
      idle: values[3] || 0,
      irq: values[5] || 0,
      nice: values[1] || 0,
      softIrq: values[6] || 0,
      steal: values[7] || 0,
      system: values[2] || 0,
      user: values[0] || 0,
    },
  }
}

const getSourceCommit = async (sourcePath: string | undefined): Promise<string> => {
  if (!sourcePath) {
    return ''
  }
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: sourcePath })
    return stdout.trim()
  } catch {
    return ''
  }
}

const getSourceDirty = async (sourcePath: string | undefined): Promise<boolean> => {
  if (!sourcePath) {
    return false
  }
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], { cwd: sourcePath })
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

const getFileHash = async (path: string): Promise<string> => {
  try {
    return createHash('sha256')
      .update(await readFile(path))
      .digest('hex')
  } catch {
    return ''
  }
}

export const getSystemMetadata = async (vscodePath: string, sourcePath?: string) => {
  const product = await readJson(join(dirname(vscodePath), 'resources', 'app', 'product.json'))
  const sourceCommit = await getSourceCommit(sourcePath)
  const sourceDirty = await getSourceDirty(sourcePath)
  const workbenchPath = join(dirname(vscodePath), 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  const sourceMapPath = sourcePath ? join(sourcePath, 'out-vscode-min', 'vs', 'workbench', 'workbench.desktop.main.js.map') : ''
  const cpu = cpus()[0]
  const proc = await getProcStat()
  return {
    architecture: process.arch,
    build: {
      commit: product?.commit || sourceCommit,
      executable: vscodePath,
      executableSha256: await getFileHash(vscodePath),
      productCommit: product?.commit || '',
      sourceCommit,
      sourceDirty,
      sourceMapSha256: sourceMapPath ? await getFileHash(sourceMapPath) : '',
      sourcePath: sourcePath || '',
      version: product?.version || '',
      workbenchSha256: await getFileHash(workbenchPath),
    },
    cpu: {
      count: cpus().length,
      model: cpu?.model || '',
      speedMhz: cpu?.speed || 0,
    },
    hostname: hostname(),
    kernel: release(),
    loadAverage: loadavg(),
    memory: {
      freeBytes: freemem(),
      totalBytes: totalmem(),
    },
    platform: platform(),
    process: proc,
    runner: {
      image: process.env.ImageOS || '',
      imageVersion: process.env.ImageVersion || '',
      name: process.env.RUNNER_NAME || '',
    },
    uptimeSeconds: uptime(),
  }
}
