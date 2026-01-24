<<<<<<< HEAD
import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as ResolveExtensionSourceMap from '../ResolveExtensionSourceMap/ResolveExtensionSourceMap.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMap.mapPathToSourceMapUrl': MapPathToSourceMapUrl.mapPathToSourceMapUrl,
  'ExtensionSourceMap.resolveExtensionSourceMap': ResolveExtensionSourceMap.resolveExtensionSourceMap,
=======
import { resolveFromPath } from '../ResolveFromPath/ResolveFromPath.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMaps.resolve': resolveFromPath,
>>>>>>> origin/main
}
