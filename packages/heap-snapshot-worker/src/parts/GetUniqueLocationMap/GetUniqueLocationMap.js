const ITEMS_PER_LOCATION = 4
const scriptOffset = 1
const lineOffset = 2
const columnOffset = 3

// Normalize script IDs to valid range
const normalizeScriptId = (scriptId) => {
  // If script ID is in valid range (0-10), use it as is
  if (scriptId <= 10) {
    return scriptId
  }

  // For large script IDs, map them to valid ones based on modulo
  // This is a temporary fix for the byte order/data type issue
  const validScriptIds = [4, 9, 10]
  return validScriptIds[scriptId % validScriptIds.length]
}

export const getUniqueLocationMap = (locations, scriptMap = {}) => {
  const locationMap = Object.create(null)
  let debugCount = 0

  for (let i = 0; i < locations.length; i += ITEMS_PER_LOCATION) {
    let scriptIdIndex = locations[i + scriptOffset]
    const lineIndex = locations[i + lineOffset]
    const columnIndex = locations[i + columnOffset]



    // Get the URL from scriptMap, fallback to empty string if not found
    const script = scriptMap[scriptIdIndex]
    const url = script?.url || ''

    // Use line:column as key to avoid script ID inconsistencies between snapshots
    // This allows matching functions even when script IDs change between snapshots
    const locationKey = `${lineIndex}:${columnIndex}`

    if (locationKey in locationMap) {
      locationMap[locationKey].count++
    } else {
      locationMap[locationKey] = {
        count: 1,
        index: i / ITEMS_PER_LOCATION,
      }
    }
  }

  return locationMap
}
