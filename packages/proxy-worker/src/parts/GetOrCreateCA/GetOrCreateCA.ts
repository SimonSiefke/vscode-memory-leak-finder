import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import * as GenerateCA from '../GenerateCA/GenerateCA.ts'
import { CA_KEY_PATH, CA_CERT_PATH, CERT_DIR } from '../Constants/Constants.ts'
import type { CertificatePair } from '../CertificatePair/CertificatePair.ts'

export const getOrCreateCA = async (): Promise<CertificatePair> => {
  await mkdir(CERT_DIR, { recursive: true })

  if (existsSync(CA_KEY_PATH) && existsSync(CA_CERT_PATH)) {
    const [key, cert] = await Promise.all([readFile(CA_KEY_PATH, 'utf8'), readFile(CA_CERT_PATH, 'utf8')])
    return { key, cert }
  }

  const ca = GenerateCA.generateCA()
  await Promise.all([writeFile(CA_KEY_PATH, ca.key, 'utf8'), writeFile(CA_CERT_PATH, ca.cert, 'utf8')])
  console.log(`[CertificateManager] Generated CA certificate at ${CA_CERT_PATH}`)
  console.log(`[CertificateManager] To trust this CA, set NODE_EXTRA_CA_CERTS=${CA_CERT_PATH}`)
  return ca
}
