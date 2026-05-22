export const getWorkflowArtifactVideoUrl = (baseUrl: string, installationId: number, artifactId: number): string => {
  const url = new URL('/api/workflow-artifacts/video', `${baseUrl.replace(/\/$/, '')}/`)
  url.searchParams.set('artifact_id', String(artifactId))
  url.searchParams.set('installation_id', String(installationId))
  return url.toString()
}
