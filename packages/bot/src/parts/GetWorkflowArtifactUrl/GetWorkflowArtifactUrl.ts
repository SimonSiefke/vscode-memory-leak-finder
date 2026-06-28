export const getWorkflowArtifactUrl = (
  baseUrl: string,
  artifactType: 'chart' | 'video',
  installationId: number,
  artifactId: number,
): string => {
  const url = new URL(`/api/workflow-artifacts/${artifactType}`, `${baseUrl.replace(/\/$/, '')}/`)
  url.searchParams.set('artifact_id', String(artifactId))
  url.searchParams.set('installation_id', String(installationId))
  return url.toString()
}
