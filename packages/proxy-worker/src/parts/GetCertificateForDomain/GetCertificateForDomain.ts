import type { CertificatePair } from '../CertificatePair/CertificatePair.ts'
import * as CryptographyWorker from '../CryptographyWorker/CryptographyWorker.ts'

export const getCertificateForDomain = async (domain: string): Promise<CertificatePair> => {
  const cryptographyWorker = await CryptographyWorker.getCryptographyWorker()
  const domainCert = await cryptographyWorker.invoke('Cryptography.getCertificateForDomain', domain)
  return domainCert
}
