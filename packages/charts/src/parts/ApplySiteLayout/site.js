const siteMenu = document.querySelector('details')

if (siteMenu) {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteMenu.open) {
      siteMenu.open = false
      siteMenu.querySelector('summary')?.focus()
    }
  })
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !siteMenu.contains(event.target)) siteMenu.open = false
  })
}
