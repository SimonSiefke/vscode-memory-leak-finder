export const isNotFoundOrNotAvailableMessage = (message) => {
  return message.includes('Response code 404') || message.includes('status code 404') || message.includes('Response code 409')
}
