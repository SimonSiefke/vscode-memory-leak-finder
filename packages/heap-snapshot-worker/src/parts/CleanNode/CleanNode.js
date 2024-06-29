export const cleanNode = (node) => {
  const { type, name, id } = node
  return {
    type,
    name,
    id,
  }
}
