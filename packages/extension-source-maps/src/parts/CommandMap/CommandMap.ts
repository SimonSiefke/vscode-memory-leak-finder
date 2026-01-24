import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as ResolveExtensionSourceMap from '../ResolveExtensionSourceMap/ResolveExtensionSourceMap.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMap.mapPathToSourceMapUrl': MapPathToSourceMapUrl.mapPathToSourceMapUrl,
  'ExtensionSourceMap.resolveExtensionSourceMap': ResolveExtensionSourceMap.resolveExtensionSourceMap,
}
