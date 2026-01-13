#!/bin/bash

NATIVE_DIR="$HOME/Library/Application Support/Mozilla/NativeMessagingHosts"
mkdir -p "$NATIVE_DIR"
curl -L -o "$NATIVE_DIR/firefox-webserial" https://github.com/kuba2k2/firefox-webserial/releases/latest/download/firefox-webserial-macos-arm64
chmod +x "$NATIVE_DIR/firefox-webserial"
cat > "$NATIVE_DIR/io.github.kuba2k2.webserial.json" <<EOL
{
	"name": "io.github.kuba2k2.webserial",
	"description": "WebSerial for Firefox",
	"path": "${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts/firefox-webserial",
	"type": "stdio",
	"allowed_extensions": ["webserial@kuba2k2.github.io"]
}
EOL
