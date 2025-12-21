export const getNodeMajorVersion = () => {
  const raw = process.versions.node || ''
  const parts = raw.split('.')
  const first = parts[0]
  const parsed = parseInt(first, 0)
  return parsed
}
