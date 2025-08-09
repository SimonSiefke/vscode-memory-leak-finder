import { cp, mkdir, rm, readFile, glob } from 'node:fs/promises'

// TODO maybe move this to filesystem worker to make testing easier

interface CopyOptions {
  readonly recursive?: boolean
  readonly force?: boolean
}

interface MkdirOptions {
  readonly recursive?: boolean
}

interface RemoveOptions {
  readonly recursive?: boolean
  readonly force?: boolean
}

interface GlobOptions {
  readonly cwd?: string
  readonly exclude?: readonly string[]
}

export const copy = async (from: string, to: string, options: CopyOptions = { recursive: true, force: true }): Promise<void> => {
  await cp(from, to, options)
}

export const makeDirectory = async (path: string, options: MkdirOptions = { recursive: true }): Promise<void> => {
  await mkdir(path, options)
}

export const remove = async (path: string, options: RemoveOptions = { recursive: true, force: true }): Promise<void> => {
  await rm(path, options)
}

export const readFileContent = async (path: string, encoding: BufferEncoding = 'utf8'): Promise<string> => {
  return await readFile(path, { encoding })
}

export const findFiles = async (pattern: string, options: GlobOptions = {}): Promise<readonly string[]> => {
  const globIterator = glob(pattern, options)
  return await Array.fromAsync(globIterator)
}

export { pathExists } from 'path-exists'
