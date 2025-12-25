export const decodeArray = (data: Uint8Array): string => {
  return new TextDecoder().decode(data)
}
