export const cleanNode = (node) => {
  const { id, name, type } = node
  return {
    id,
    name,
    type,
  }
}
