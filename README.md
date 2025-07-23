
<div align="right">
  <details>
    <summary >🌐 Language</summary>
    <div>
      <div align="center">
        <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=en">English</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=zh-CN">简体中文</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=zh-TW">繁體中文</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=ja">日本語</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=ko">한국어</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=hi">हिन्दी</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=th">ไทย</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=fr">Français</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=de">Deutsch</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=es">Español</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=it">Italiano</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=ru">Русский</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=pt">Português</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=nl">Nederlands</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=pl">Polski</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=ar">العربية</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=fa">فارسی</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=tr">Türkçe</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=vi">Tiếng Việt</a>
        | <a href="https://openaitx.github.io/view.html?user=kuba2k2&project=firefox-webserial&lang=id">Bahasa Indonesia</a>
      </div>
    </div>
  </details>
</div>

# WebSerial for Firefox

WebSerial API Polyfill for Mozilla Firefox browser

## Introduction

This add-on allows to use the WebSerial API in Firefox.

It uses a native application to communicate with serial ports.

**NOTE:** Currently, the add-on only works on Windows and Linux (x86-64).

## Installation

The add-on is available for download from Mozilla Addons:
[WebSerial for Firefox](https://addons.mozilla.org/pl/firefox/addon/webserial-for-firefox/).

The native application needs to be installed on the computer first. The GUI will offer to download the
native application when you first try to open a serial port.

### Installation on Windows

The .exe file is an installer - just open it and install the native application.

### Installation on Linux

Run script:

```sh
curl -s -L https://raw.githubusercontent.com/kuba2k2/firefox-webserial/master/native/install/linux_x86_64.sh | bash
```

#### or install manually

1. Put the downloaded file in `~/.mozilla/native-messaging-hosts`
2. Rename it to just `firefox-webserial`.
3. Make it executable: `chmod +x ~/.mozilla/native-messaging-hosts/firefox-webserial`.
4. Create a file named `io.github.kuba2k2.webserial.json` in the same directory, with this content:
	```json
	{
		"name": "io.github.kuba2k2.webserial",
		"description": "WebSerial for Firefox",
		"path": "/home/USER/.mozilla/native-messaging-hosts/firefox-webserial",
		"type": "stdio",
		"allowed_extensions": ["webserial@kuba2k2.github.io"]
	}
	```
	Adjust `/home/USER` to match your username.
5. Restart the browser and use the extension.

**NOTE:** On Alpine Linux (or other musl-based distros) you will need to have `gcompat` installed.

## Usage

Some applications that can work on Firefox with this add-on:

- [Spacehuhn Serial Terminal](https://serial.huhn.me/)
- [Google Chrome Labs Serial Terminal](https://googlechromelabs.github.io/serial-terminal/)
- [ESPWebTool by Spacehuhn](https://esp.huhn.me/)
- [ESP Tool by Espressif](https://espressif.github.io/esptool-js/)
- [ESPHome Web](https://web.esphome.io/)
- [ESP Web Tools by ESPHome](https://esphome.github.io/esp-web-tools/)
- [NinjaTerm by Geoffrey Hunter](https://ninjaterm.mbedded.ninja/)

## Debugging

To view logs produced by the extension for debugging purposes:

- Open [about:debugging](about:debugging), click `This Firefox`
- Find `WebSerial for Firefox`, click `Inspect`
- Type in the console: `window.wsdebug = true`
- Go to a website of choice, try connecting to a serial port - the console should show extension logs.

## License

```
MIT License

Copyright (c) 2023 Kuba Szczodrzyński

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
