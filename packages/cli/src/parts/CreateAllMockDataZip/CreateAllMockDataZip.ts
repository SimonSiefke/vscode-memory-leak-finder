interface CreateAllMockDataZipModule {
  createAllMockDataZip(): Promise<{
    readonly outputDirectory: string
    readonly outputFilePath: string
    readonly includedDirectories: readonly string[]
  }>
}

export const createAllMockDataZip = async (): Promise<void> => {
  // TODO launch worker instead of import module
  const moduleUrl = new URL('../../../../launch-worker/src/parts/CreateAllMockDataZip/CreateAllMockDataZip.ts', import.meta.url)
  const module = (await import(moduleUrl.href)) as CreateAllMockDataZipModule
  const result = await module.createAllMockDataZip()
  console.log(`[create-all-mock-data-zip] created ${result.outputFilePath}`)
  console.log(`[create-all-mock-data-zip] included directories: ${result.includedDirectories.join(', ') || '<none>'}`)
}
