export const matchesFilterValue = (dirent, filterValue) => {
  if (filterValue.startsWith('^')) {
    return dirent.startsWith(filterValue.slice(1))
  }
  return dirent.includes(filterValue)
}
