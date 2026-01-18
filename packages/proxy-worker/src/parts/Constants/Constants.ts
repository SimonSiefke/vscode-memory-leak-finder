import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const CERT_DIR = join(Root.root, '.vscode-proxy-certs')
export const CA_KEY_PATH = join(CERT_DIR, 'ca-key.pem')
export const CA_CERT_PATH = join(CERT_DIR, 'ca-cert.pem')
