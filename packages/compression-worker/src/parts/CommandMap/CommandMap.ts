import { decompressBody } from '../DecompressBody/DecompressBody.ts'
import { unzip } from '../Unzip/Unzip.ts'

export const commandMap = {
  'Compression.decompressBody': decompressBody,
  'Compression.unzip': unzip,
}
