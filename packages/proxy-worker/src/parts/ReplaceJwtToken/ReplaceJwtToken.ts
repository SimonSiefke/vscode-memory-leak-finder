import * as CryptographyWorker from '../CryptographyWorker/CryptographyWorker.ts'

export const replaceJwtToken = async (token: string): Promise<string> => {
  try {
    const cryptographyWorker = await CryptographyWorker.getCryptographyWorker()
    const newToken = await cryptographyWorker.invoke('Cryptography.replaceJwtToken', token)
    return newToken
  } catch (error) {
    // If anything fails, return the original token
    console.warn(`Failed to replace JWT token: ${error}`)
    return token
  }
}
