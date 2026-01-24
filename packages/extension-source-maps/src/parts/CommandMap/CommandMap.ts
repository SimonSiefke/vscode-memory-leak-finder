import * as ResolveExtensionSourceMap from '../ResolveExtensionSourceMap/ResolveExtensionSourceMap.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMap.resolveExtensionSourceMap': ResolveExtensionSourceMap.resolveExtensionSourceMap,
}
