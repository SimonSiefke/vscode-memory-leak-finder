import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'LoadSourceMap.loadSourceMap': LoadSourceMap.loadSourceMap,
}
