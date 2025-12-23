import { existsSync } from 'fs'
import { readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import type { CertificatePair } from '../CertificatePair/CertificatePair.ts'
import { CERT_DIR } from '../Constants/Constants.ts'
import * as GenerateCertificateForDomain from '../GenerateCertificateForDomain/GenerateCertificateForDomain.ts'
import * as GetOrCreateCA from '../GetOrCreateCA/GetOrCreateCA.ts'
import * as ValidateCertificateKeyPair from '../ValidateCertificateKeyPair/ValidateCertificateKeyPair.ts'

const DOMAIN_SANITIZE_REGEX = /[^a-zA-Z0-9]/g

export const getCertificateForDomain = async (domain: string): Promise<CertificatePair> => {
  const ca = await GetOrCreateCA.getOrCreateCA()
  const certPath = join(CERT_DIR, `${domain.replaceAll(DOMAIN_SANITIZE_REGEX, '_')}-cert.pem`)
  const keyPath = join(CERT_DIR, `${domain.replaceAll(DOMAIN_SANITIZE_REGEX, '_')}-key.pem`)

  if (existsSync(certPath) && existsSync(keyPath)) {
    const cert = await readFile(certPath, 'utf8')
    const key = await readFile(keyPath, 'utf8')

    // Validate that the certificate and key match
    if (ValidateCertificateKeyPair.validateCertificateKeyPair(cert, key)) {
      return { cert, key }
    }

    // If validation fails, delete the mismatched files and regenerate
    console.log(`[CertificateManager] Certificate-key mismatch detected for ${domain}, regenerating...`)
    await Promise.allSettled([unlink(certPath), unlink(keyPath)])
  }

  const domainCert = GenerateCertificateForDomain.generateCertificateForDomain(domain, ca.key, ca.cert)
  await writeFile(certPath, domainCert.cert, 'utf8')
  await writeFile(keyPath, domainCert.key, 'utf8')
  return domainCert
}
