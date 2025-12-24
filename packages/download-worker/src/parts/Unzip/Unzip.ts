import { launchCompressionWorker } from '../LaunchCompressionWorker/LaunchCompressionWorker.ts'

export const unzip = async (inFile: string, outDir: string): Promise<void> => {
  await using rpc = await launchCompressionWorker()
  await rpc.invoke('Compression.unzip', inFile, outDir)
}
