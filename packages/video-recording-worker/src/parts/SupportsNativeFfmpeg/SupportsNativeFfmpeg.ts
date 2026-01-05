import { existsSync } from 'node:fs'

export const supportsNativeFfmpeg = (): boolean => {
  return existsSync('/usr/bin/ffmpeg')
}

