import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { basename, dirname, join } from 'path'
import * as Assert from '../Assert/Assert.ts'
import * as Exec from '../Exec/Exec.ts'
import * as TestStatus from '../TestStatus/TestStatus.ts'

interface TestEvent {
  timestamp: number
  testName: string
  status: 'running' | 'passed' | 'failed'
}

interface VideoMetadata {
  testEvents: TestEvent[]
  duration: number
}

export const getTestStatusOverlayFilter = (testEvents: TestEvent[], duration: number): string => {
  let filter = ''

  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i]
    const nextEvent = testEvents[i + 1]
    const endTime = nextEvent ? nextEvent.timestamp : duration

    const statusIcon = event.status === 'running' ? '⏳' : event.status === 'passed' ? '✅' : '❌'
    const text = `${event.testName} ${statusIcon}`

    // Create a conditional text overlay for this time range
    const condition = `between(t,${event.timestamp},${endTime})`
    const drawtext = `drawtext=text='${text}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black@0.8:boxborderw=5:enable='${condition}'`

    if (filter) {
      filter += `,${drawtext}`
    } else {
      filter = drawtext
    }
  }

  return filter
}

const supportsNativeFfmpeg = (): boolean => {
  return existsSync('/usr/bin/ffmpeg')
}

export const addTestStatusBanner = async (inputFile: string, outputFile: string, testEvents: TestEvent[]): Promise<void> => {
  Assert.string(inputFile)
  Assert.string(outputFile)

  if (!supportsNativeFfmpeg()) {
    console.log('ffmpeg not available for post-processing, skipping banner')
    return
  }

  if (testEvents.length === 0) {
    console.log('No test events to process, skipping banner')
    return
  }

  // Get video duration first
  const durationArgs = ['-i', inputFile, '-f', 'null', '-']
  const durationResult = await Exec.exec('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', inputFile])
  const duration = parseFloat(durationResult.stdout.trim())

  const filter = getTestStatusOverlayFilter(testEvents, duration)

  const args = [
    '-i',
    inputFile,
    '-vf',
    filter,
    '-c:v',
    'libvpx-vp8',
    '-crf',
    '8',
    '-b:v',
    '1M',
    '-y',
    outputFile,
  ]

  await Exec.exec('ffmpeg', args)
}

export const createTestEvent = (testName: string, status: 'running' | 'passed' | 'failed', timestamp: number): TestEvent => {
  Assert.string(testName)
  Assert.string(status)
  Assert.number(timestamp)

  return {
    testName,
    status,
    timestamp,
  }
}
