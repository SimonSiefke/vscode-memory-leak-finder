export const extractItemsFromData = (data: any): readonly any[] => {
  // Handle both array and object with array property (namedFunctionCount2 or namedFunctionCount3)
  if (Array.isArray(data)) {
    return data
  } else if (data.namedFunctionCount3 && Array.isArray(data.namedFunctionCount3)) {
    return data.namedFunctionCount3
  } else if (data.namedFunctionCount2 && Array.isArray(data.namedFunctionCount2)) {
    return data.namedFunctionCount2
  } else {
    return []
  }
}
