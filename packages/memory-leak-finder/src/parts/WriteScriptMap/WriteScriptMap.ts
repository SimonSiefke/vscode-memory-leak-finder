import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const writeScriptMap = async (
  scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>,
  id: number,
): Promise<void> => {
  const outFile = join(Root.root, '.vscode-script-maps', `${id}.json`)
  const dir = dirname(outFile)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  await writeFile(outFile, JSON.stringify(scriptMap, null, 2) + '\n')
}
