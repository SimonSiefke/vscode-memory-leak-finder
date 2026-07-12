#!/usr/bin/env bash

set -euo pipefail

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
SOURCE_EXTENSION_PATH="$ROOT/packages/e2e/fixtures/sample.single-iframe-webview"
EXTENSION_PATH="$SOURCE_EXTENSION_PATH"
LAUNCH_ARGS=()

if [[ "${VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER:-}" == "1" ]]; then
	LAUNCH_ARGS+=(--enable-proposed-api=vscode-memory-leak-finder.single-iframe-webview)
else
	EXTENSION_PATH="$ROOT/.vscode-test/extensions/sample.single-iframe-webview-legacy"
	rm -rf "$EXTENSION_PATH"
	mkdir -p "$(dirname "$EXTENSION_PATH")"
	cp -R "$SOURCE_EXTENSION_PATH" "$EXTENSION_PATH"
	cp "$SOURCE_EXTENSION_PATH/package.legacy.json" "$EXTENSION_PATH/package.json"
fi

exec "$VSCODE_COMMAND" \
	--extensionDevelopmentPath="$EXTENSION_PATH" \
	--shared-data-dir="$SHARED_DATA_DIR" \
	"${LAUNCH_ARGS[@]}" \
	"$@"
