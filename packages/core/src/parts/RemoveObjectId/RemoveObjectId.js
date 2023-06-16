export const removeObjectId = (object) => {
  const { objectId, ...rest } = object
  return rest
}
