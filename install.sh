#!/bin/bash

curl -L -o ~/.mozilla/native-messaging-hosts/firefox-webserial https://github.com/kuba2k2/firefox-webserial/releases/latest/download/firefox-webserial-linux-x86-64
chmod +x ~/.mozilla/native-messaging-hosts/firefox-webserial



kernel="2.6.39"
distro="xyz"
cat > ~/.mozilla/native-messaging-hosts/io.github.kuba2k2.webserial.json <<EOL
{
	"name": "io.github.kuba2k2.webserial",
	"description": "WebSerial for Firefox",
	"path": "${HOME}/.mozilla/native-messaging-hosts/firefox-webserial",
	"type": "stdio",
	"allowed_extensions": ["webserial@kuba2k2.github.io"]
}
EOL
