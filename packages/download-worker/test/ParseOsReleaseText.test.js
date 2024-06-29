import { expect, test } from '@jest/globals'
import * as ParseOsReleaseText from '../src/parts/ParseOsReleaseText/ParseOsReleaseText.js'

test('parseOsReleaseText', () => {
  const releaseText = `ID=ubuntu
VERSION="24.04 LTS (Noble Numbat)"
VERSION_ID="24.04"`
  expect(ParseOsReleaseText.parseOSReleaseText(releaseText)).toEqual({
    id: 'ubuntu',
    version_id: '24.04',
    version: '24.04 LTS (Noble Numbat)',
  })
})

test('parseOsReleaseText - empty lines', () => {
  const releaseText = `

`
  expect(ParseOsReleaseText.parseOSReleaseText(releaseText)).toEqual({})
})
