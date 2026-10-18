import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import type { FileOperation } from '../src/parts/FileOperation/FileOperation.ts'
import { withCopilotPackagingWorkaround } from '../src/parts/WithCopilotPackagingWorkaround/WithCopilotPackagingWorkaround.ts'

const sourcePath = '/test/build/lib/extensions.ts'
const ignorePath = '/test/build/.moduleignore'
const temporaryPath = '/test/build/.moduleignore.benchmark-copilot'
const source = `export function other() { return path.join(root, 'build', '.moduleignore'); }
export function packageCopilotExtensionStream() { return path.join(root, 'build', '.moduleignore'); }
export function next() {}`

const filesystem = (sourceText = source) => {
  const files = new Map([
    [sourcePath, sourceText],
    [ignorePath, '@github/copilot/**\n@github/copilot-sdk-linux-x64/**\n**/tests/**\n'],
  ])
  FileSystemWorker.set(
    MockRpc.create({
      commandMap: {},
      invoke(method: string, ...params: unknown[]) {
        if (method === 'FileSystem.readFileContent') return files.get(String(params[0]))
        if (method === 'FileSystem.exists') return files.has(String(params[0]))
        if (method === 'FileSystem.applyFileOperations') {
          for (const operation of params[0] as FileOperation[]) {
            if (operation.type === 'write') files.set(operation.path, operation.content)
            else if (operation.type === 'remove') files.delete(operation.from)
            else throw new Error('Unexpected filesystem mutation')
          }
          return undefined
        }
        throw new Error(`Unexpected ${method}`)
      },
    }),
  )
  return files
}

test('keeps application exclusions intact and restores build source after failure', async () => {
  const files = filesystem()
  const original = new Map(files)
  await expect(
    withCopilotPackagingWorkaround('/test', async () => {
      expect(files.get(ignorePath)).toBe(original.get(ignorePath))
      expect(files.get(temporaryPath)).toBe('**/tests/**\n')
      expect(files.get(sourcePath)).toContain("other() { return path.join(root, 'build', '.moduleignore'); }")
      expect(files.get(sourcePath)).toContain(
        "packageCopilotExtensionStream() { return path.join(root, 'build', '.moduleignore.benchmark-copilot'); }",
      )
      throw new Error('gulp failed')
    }),
  ).rejects.toThrow('gulp failed')
  expect(files).toEqual(original)
})

test('restores build source after success', async () => {
  const files = filesystem()
  const original = new Map(files)
  await expect(withCopilotPackagingWorkaround('/test', async () => 42)).resolves.toBe(42)
  expect(files).toEqual(original)
})

test('refuses unknown source layouts without changing them', async () => {
  const files = filesystem('export function unknown() {}')
  const original = new Map(files)
  await expect(withCopilotPackagingWorkaround('/test', async () => 42)).rejects.toThrow('does not match this revision')
  expect(files).toEqual(original)
})
