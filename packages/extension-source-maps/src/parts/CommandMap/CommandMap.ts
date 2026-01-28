import { resolveFromPath } from '../ResolveFromPath/ResolveFromPath.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'ExtensionSourceMaps.resolve': resolveFromPath,
}
