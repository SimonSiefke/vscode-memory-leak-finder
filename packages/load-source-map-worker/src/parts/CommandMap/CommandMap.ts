import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'
import * as LoadSourceMaps from '../LoadSourceMaps/LoadSourceMaps.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'LoadSourceMap.loadSourceMap': LoadSourceMap.loadSourceMap,
  'LoadSourceMaps.loadSourceMaps': LoadSourceMaps.loadSourceMaps,
}
