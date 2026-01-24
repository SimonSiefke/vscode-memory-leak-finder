import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMap.mapPathToSourceMapUrl': MapPathToSourceMapUrl.mapPathToSourceMapUrl,
}
