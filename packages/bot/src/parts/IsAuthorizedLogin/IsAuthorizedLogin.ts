export const isAuthorizedLogin = (allowedLogins: readonly string[], login: string): boolean => {
  return allowedLogins.includes(login)
}
