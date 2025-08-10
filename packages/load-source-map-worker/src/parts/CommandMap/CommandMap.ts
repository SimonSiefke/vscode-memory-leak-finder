import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'LoadSourceMap.loadSourceMap': LoadSourceMap.loadSourceMap,
}
