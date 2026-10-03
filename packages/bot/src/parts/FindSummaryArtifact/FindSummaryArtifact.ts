type ArtifactRecord = {
  readonly archive_download_url: string
  readonly id: number
  readonly name: string
}

export const findSummaryArtifact = (artifacts: readonly ArtifactRecord[]): ArtifactRecord | undefined => {
  return artifacts.find((artifact) => artifact.name.endsWith('-summary'))
}
