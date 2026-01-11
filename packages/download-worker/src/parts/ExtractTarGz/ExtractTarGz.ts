import { launchCompressionWorker } from '../LaunchCompressionWorker/LaunchCompressionWorker.ts'

export const extractTarGz = async (inFile: string, outDir: string): Promise<void> => {
  await using rpc = await launchCompressionWorker()
  await rpc.invoke('Compression.extractTarGz', inFile, outDir)
}
