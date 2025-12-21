export const matchesFilterValue = (dirent, filterValue) => {
  if (filterValue.startsWith('^')) {
    return dirent.startsWith(filterValue.slice(1))
  }
  if (filterValue.endsWith('$')) {
    return dirent.endsWith(filterValue.slice(0, -1))
  }
  return dirent.includes(filterValue)
}
