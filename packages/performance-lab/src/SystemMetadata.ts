import { readFile } from 'node:fs/promises'
import { cpus, hostname, platform, release } from 'node:os'
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

export const getSystemMetadata = async (vscodePath: string, sourcePath?: string) => {
  const product = await readJson(join(dirname(vscodePath), 'resources', 'app', 'product.json'))
  const cpu = cpus()[0]
  return {
    architecture: process.arch,
    build: {
      commit: product?.commit || (await getSourceCommit(sourcePath)),
      executable: vscodePath,
      sourcePath: sourcePath || '',
      version: product?.version || '',
    },
    cpu: {
      count: cpus().length,
      model: cpu?.model || '',
      speedMhz: cpu?.speed || 0,
    },
    hostname: hostname(),
    kernel: release(),
    platform: platform(),
  }
}
