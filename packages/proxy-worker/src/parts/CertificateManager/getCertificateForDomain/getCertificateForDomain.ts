import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import * as getOrCreateCA from '../getOrCreateCA/getOrCreateCA.ts'
import * as generateCertificateForDomain from '../generateCertificateForDomain/generateCertificateForDomain.ts'
import { CERT_DIR } from '../constants.ts'
import type { CertificatePair } from '../CertificatePair.ts'

export const getCertificateForDomain = async (
  domain: string,
): Promise<CertificatePair> => {
  const ca = await getOrCreateCA.getOrCreateCA()
  const certPath = join(CERT_DIR, `${domain.replace(/[^a-zA-Z0-9]/g, '_')}-cert.pem`)
  const keyPath = join(CERT_DIR, `${domain.replace(/[^a-zA-Z0-9]/g, '_')}-key.pem`)

  if (existsSync(certPath) && existsSync(keyPath)) {
    const cert = await readFile(certPath, 'utf8')
    const key = await readFile(keyPath, 'utf8')
    return { cert, key }
  }

  const domainCert = generateCertificateForDomain.generateCertificateForDomain(
    domain,
    ca.key,
    ca.cert,
  )
  await writeFile(certPath, domainCert.cert, 'utf8')
  await writeFile(keyPath, domainCert.key, 'utf8')
  return domainCert
}
