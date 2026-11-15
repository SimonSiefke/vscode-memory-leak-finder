import { readFile } from 'node:fs/promises'
import { parentPort, workerData } from 'node:worker_threads'
import { findDuplicateFunctions } from '../FindDuplicateFunctions/FindDuplicateFunctions.ts'

const { file, sourceType } = workerData as { file: string; sourceType: 'script' | 'module' }
parentPort!.postMessage(findDuplicateFunctions(await readFile(file, 'utf8'), file, sourceType))
