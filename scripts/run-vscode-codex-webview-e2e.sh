#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${VSCODE_CODEX_EXTENSION_PATH:-}" ]]; then
	echo "VSCODE_CODEX_EXTENSION_PATH is required" >&2
	exit 1
fi

if [[ -n "${VSCODE_EXECUTABLE_PATH:-}" ]]; then
	VSCODE_COMMAND="$VSCODE_EXECUTABLE_PATH"
elif [[ -n "${VSCODE_SOURCE_PATH:-}" ]]; then
	VSCODE_COMMAND="$VSCODE_SOURCE_PATH/scripts/code.sh"
else
	echo "VSCODE_EXECUTABLE_PATH or VSCODE_SOURCE_PATH must be set" >&2
	exit 1
fi

ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")
SHARED_DATA_DIR="$ROOT/.vscode-shared-data-dir"
LOADER_MODE=legacy
LAUNCH_ARGS=(--enable-proposed-api=openai.chatgpt)

if [[ "${VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER:-}" == "1" ]]; then
	LOADER_MODE=singleIframe
fi

node "$ROOT/scripts/configure-codex-webview-benchmark.mjs" "$VSCODE_CODEX_EXTENSION_PATH" "$LOADER_MODE"
touch "$ROOT/.vscode-test-workspace/webview-benchmark-warmup.txt"

exec "$VSCODE_COMMAND" \
	--extensionDevelopmentPath="$VSCODE_CODEX_EXTENSION_PATH" \
	--shared-data-dir="$SHARED_DATA_DIR" \
	"${LAUNCH_ARGS[@]}" \
	"$@"
