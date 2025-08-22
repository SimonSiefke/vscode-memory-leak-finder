import { join } from 'node:path'
import { readFileSync } from '../FileSystem/FileSystem.ts'
import { root } from '../Root/Root.ts'

export interface ScriptInfo {
  readonly url: string
  readonly sourceMapUrl?: string
}

export type ScriptMap = Record<number, ScriptInfo>

const getScriptMapPath = (scriptMapId: number): string => {
  return join(root, '.vscode-script-maps', `${scriptMapId}.json`)
}

const emptyScriptMap = Object.create(null)

export const readScriptMap = (scriptMapId: number): ScriptMap => {
  if (!Number.isFinite(scriptMapId)) {
    return emptyScriptMap
  }
  const path = getScriptMapPath(scriptMapId)
  try {
    const content = readFileSync(path, 'utf8')
    const json = JSON.parse(content) as ScriptMap
    return json
  } catch {
    return emptyScriptMap
  }
}
