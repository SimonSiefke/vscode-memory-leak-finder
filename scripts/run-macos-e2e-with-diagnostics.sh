#!/usr/bin/env bash

set -u

artifact_dir="${MACOS_E2E_DIAGNOSTICS_DIR:-.github-artifacts/macos-e2e}"
user_data_dir="${MACOS_E2E_USER_DATA_DIR:-.vscode-user-data-dir}"
diagnostic_reports_dir="${HOME}/Library/Logs/DiagnosticReports"

copy_directory_if_exists() {
  local source="$1"
  local destination_root="$2"
  if [[ ! -e "$source" ]]; then
    return
  fi
  mkdir -p "$destination_root"
  cp -R "$source" "$destination_root/"
}

dump_directory_logs() {
  local directory="$1"
  local label="$2"
  echo "::group::${label}"
  if [[ ! -d "$directory" ]]; then
    echo "Directory not found: ${directory}"
    echo "::endgroup::"
    return
  fi
  find "$directory" -type f | sort | tail -n 50
  while IFS= read -r file; do
    echo "--- ${file}"
    tail -n 200 "$file" || true
  done < <(find "$directory" -type f \( -name '*.log' -o -name '*.txt' -o -name '*.crash' -o -name '*.ips' \) | sort | tail -n 20)
  echo "::endgroup::"
}

rm -rf "$artifact_dir"
mkdir -p "$artifact_dir"

if [[ $# -eq 0 ]]; then
  echo 'Usage: bash scripts/run-macos-e2e-with-diagnostics.sh <command> [args...]'
  exit 1
fi

"$@"
exit_code=$?

copy_directory_if_exists "$user_data_dir" "$artifact_dir"
copy_directory_if_exists "$diagnostic_reports_dir" "$artifact_dir"

if [[ $exit_code -ne 0 ]]; then
  echo "macOS e2e command failed with exit code ${exit_code}"
  dump_directory_logs "$user_data_dir" 'VS Code user data logs'
  dump_directory_logs "$diagnostic_reports_dir" 'macOS DiagnosticReports'
fi

exit "$exit_code"