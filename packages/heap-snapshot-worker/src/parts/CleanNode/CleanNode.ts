export const cleanNode = (node: any) => {
  const { id, name, type } = node
  return {
    id,
    name,
    type,
  }
}
