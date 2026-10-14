import { createReadStream, createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

export const compressEvidence = async (path: string): Promise<string> => {
  const destination = `${path}.gz`
  await pipeline(createReadStream(path), createGzip({ level: 6 }), createWriteStream(destination))
  await rm(path)
  return destination
}
