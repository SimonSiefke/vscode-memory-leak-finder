export const selectText = (element: HTMLInputElement | HTMLTextAreaElement): void => {
  element.setSelectionRange(0, element.value.length)
}
