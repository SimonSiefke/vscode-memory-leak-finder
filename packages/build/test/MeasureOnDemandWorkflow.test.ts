import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@jest/globals'

const getWorkflowPath = (): string => {
  const currentFilePath = fileURLToPath(import.meta.url)
  const testDir = dirname(currentFilePath)
  return join(testDir, '..', '..', '..', '.github', 'workflows', 'measure-on-demand.yml')
}

test('measure-on-demand workflow accepts and masks snapshot download inputs', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain('download_user_data_zip_file_url:')
  expect(workflow).toContain('download_user_data_zip_file_token:')
  expect(workflow).toContain('download_all_mock_data_zip_file_url:')
  expect(workflow).toContain('description: User-data download URL passed by the bot')
  expect(workflow).toContain('description: User-data download token passed by the bot')
  expect(workflow).toContain('description: All mock data download URL passed by the bot')
  expect(workflow.match(/required: false/g) || []).toHaveLength(3)

  expect(workflow.match(/- name: Initialize snapshot download settings/g) || []).toHaveLength(2)
  expect(workflow).toContain('event.inputs?.download_user_data_zip_file_url')
  expect(workflow).toContain('event.inputs?.download_all_mock_data_zip_file_url')
  expect(workflow).toContain('event.inputs?.download_user_data_zip_file_token')
  expect(workflow).toContain('measure workflow requires download_user_data_zip_file_url or download_all_mock_data_zip_file_url input')
  expect(workflow).toContain('process.stdout.write(`::add-mask::${value}\\n`)')
  expect(workflow).toContain("exportMaskedVariable('DOWNLOAD_USER_DATA_ZIP_FILE_URL', url)")
  expect(workflow).toContain("exportMaskedVariable('DOWNLOAD_ALL_MOCK_DATA_ZIP_FILE_URL', allMockDataUrl)")
  expect(workflow).toContain("exportMaskedVariable('DOWNLOAD_USER_DATA_ZIP_FILE_TOKEN', token)")

  expect(workflow).not.toContain('DOWNLOAD_USER_DATA_ZIP_FILE_TOKEN: ${{ inputs.download_user_data_zip_file_token }}')
  expect(workflow).not.toContain('DOWNLOAD_USER_DATA_ZIP_FILE_URL: ${{ inputs.download_user_data_zip_file_url }}')
  expect(workflow).not.toContain('--download-user-data-zip-file-token')
  expect(workflow).not.toContain('--download-user-data-zip-file-url')
})
