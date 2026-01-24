<<<<<<< HEAD
import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMap.mapPathToSourceMapUrl': MapPathToSourceMapUrl.mapPathToSourceMapUrl,
=======
import { resolveFromPath } from '../ResolveFromPath/ResolveFromPath.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMaps.resolve': resolveFromPath,
>>>>>>> feature/resolve
}
