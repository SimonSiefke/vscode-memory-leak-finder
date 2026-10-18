import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../Path/Path.ts'

// Some revisions apply the application's Copilot exclusions to the built-in
// extension too, then fail its SDK packaging step. Keep this benchmark-only
// workaround explicit and restore the build source even when gulp fails.
export const withCopilotPackagingWorkaround = async <T>(cwd: string, build: () => Promise<T>): Promise<T> => {
  const sourcePath = Path.join(cwd, 'build', 'lib', 'extensions.ts')
  const ignorePath = Path.join(cwd, 'build', '.moduleignore')
  const temporaryIgnorePath = Path.join(cwd, 'build', '.moduleignore.benchmark-copilot')
  const source = await FileSystemWorker.readFileContent(sourcePath)
  const ignore = await FileSystemWorker.readFileContent(ignorePath)
  const start = source.indexOf('export function packageCopilotExtensionStream()')
  const end = source.indexOf('\nexport function ', start + 1)
  const section = source.slice(start, end)
  const expression = "path.join(root, 'build', '.moduleignore')"
  if (start < 0 || end < 0 || !section.includes(expression) || !ignore.split('\n').includes('@github/copilot/**')) {
    throw new Error('Copilot packaging workaround does not match this revision; refusing to change its build')
  }
  if (await FileSystemWorker.pathExists(temporaryIgnorePath)) throw new Error('Copilot packaging workaround file already exists')
  const filtered = ignore
    .split('\n')
    .filter((line) => !line.startsWith('@github/copilot'))
    .join('\n')
  const patched =
    source.slice(0, start) +
    section.replaceAll(expression, "path.join(root, 'build', '.moduleignore.benchmark-copilot')") +
    source.slice(end)
  try {
    await FileSystemWorker.applyFileOperations([
      { type: 'write', path: temporaryIgnorePath, content: filtered },
      { type: 'write', path: sourcePath, content: patched },
    ])
    return await build()
  } finally {
    await FileSystemWorker.applyFileOperations([
      { type: 'write', path: sourcePath, content: source },
      { type: 'remove', from: temporaryIgnorePath },
    ])
  }
}
