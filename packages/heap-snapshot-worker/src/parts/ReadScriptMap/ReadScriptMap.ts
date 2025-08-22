import { readFileSync } from '../FileSystem/FileSystem.ts'

export interface ScriptInfo {
  readonly url: string
  readonly sourceMapUrl?: string
}

export type ScriptMap = Record<number, ScriptInfo>

const getScriptMapPath = (scriptMapId: number): string => {
  return `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-script-maps/${scriptMapId}.json`
}

export const readScriptMap = (scriptMapId: number): ScriptMap => {
  if (!Number.isFinite(scriptMapId)) {
    return Object.create(null)
  }
  const path = getScriptMapPath(scriptMapId)
  try {
    const content = readFileSync(path, 'utf8') as string
    const json = JSON.parse(content) as ScriptMap
    return json
  } catch {
    return Object.create(null)
  }
}
