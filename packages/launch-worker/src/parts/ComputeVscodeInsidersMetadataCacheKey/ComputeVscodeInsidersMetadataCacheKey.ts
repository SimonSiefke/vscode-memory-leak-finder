import { createHash } from 'node:crypto'

export const computeVscodeInsidersMetadataCacheKey = (platform: string, arch: string, commit: string): string => {
  const hash = createHash('sha1')
  hash.update(platform)
  hash.update(arch)
  hash.update(commit)
  return hash.digest('hex')
}
