export const createCountMap = <T extends { [K in Key]: string } & { count: number }, Key extends string>(array: readonly T[], key: Key): { [K in string]: number } => {
  const map = Object.create(null)
  for (const element of array) {
    map[element[key]] = element.count
  }
  return map
}
