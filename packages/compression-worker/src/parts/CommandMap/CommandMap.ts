import { decompressBody } from '../DecompressBody/DecompressBody.ts'
import { extractTarGz } from '../ExtractTarGz/ExtractTarGz.ts'
import { unzip } from '../Unzip/Unzip.ts'

export const commandMap = {
  'Compression.decompressBody': decompressBody,
  'Compression.extractTarGz': extractTarGz,
  'Compression.unzip': unzip,
}
