import React from "react"
import styled from "styled-components"
import { NativeParams } from "../../utils/types"
import { Button } from "../controls/Button"

const Container = styled.div`
	text-align: center;
`

type InstallerOs = {
	name: string
	arch: { [arch in browser.runtime.PlatformArch]?: InstallerArch }
}

type InstallerArch = {
	file: string
	isInstaller?: boolean
}

const releaseInfoUrl =
	"https://github.com/kuba2k2/firefox-webserial/releases/tag/vVERSION"
const releaseDownloadUrl =
	"https://github.com/kuba2k2/firefox-webserial/releases/download/vVERSION/"

const installers: { [os in browser.runtime.PlatformOs]?: InstallerOs } = {
	win: {
		name: "Windows",
		arch: {
			"x86-32": {
				file: "firefox-webserial-vVERSION.exe",
				isInstaller: true,
			},
			"x86-64": {
				file: "firefox-webserial-vVERSION.exe",
				isInstaller: true,
			},
		},
	},
	linux: {
		name: "Linux",
		arch: {
			// "x86-32": {
			// 	file: "firefox-webserial-linux-x86-32",
			// },
			"x86-64": {
				file: "firefox-webserial-linux-x86-64",
			},
			// "arm": {
			// 	file: "firefox-webserial-linux-arm",
			// },
			// "aarch64": {
			// 	file: "firefox-webserial-linux-aarch64",
			// },
		},
	},
	mac: {
		name: "macOS",
		arch: {
			"x86-64": {
				file: "firefox-webserial-macos-x86-64",
			},
			"aarch64": {
				file: "firefox-webserial-macos-arm64",
			},
		},
	},
}

export class NativeInstaller extends React.Component<NativeParams> {
	handleDownloadClick() {
		const onBlur = document.onblur
		document.onblur = null
		document.onfocus = () => {
			document.onfocus = null
			document.onblur = onBlur
		}
	}

	render() {
		const os = installers[this.props.platform.os]
		const arch = os?.arch[this.props.platform.arch]

		if (!arch) {
			return (
				<Container>
					<h4>Native add-on not available</h4>

					<p>
						The native application is not available on your
						operating system.
					</p>

					<p>
						Your OS is:{" "}
						<code>
							{this.props.platform.os}, {this.props.platform.arch}
						</code>
					</p>

					<p>
						Please{" "}
						<a
							href="https://github.com/kuba2k2/firefox-webserial"
							target="_blank"
						>
							report the issue on GitHub
						</a>
						.
					</p>
				</Container>
			)
		}

		const version = browser.runtime.getManifest().version
		const infoUrl = releaseInfoUrl.replace("VERSION", version)
		const downloadUrl =
			releaseDownloadUrl.replace("VERSION", version) +
			arch.file.replace("VERSION", version)

		return (
			<Container>
				{this.props.state == "not-installed" && (
					<h4>Native add-on not installed</h4>
				)}
				{this.props.state == "outdated" && (
					<h4>Native add-on outdated</h4>
				)}
				{this.props.state == "error" && <h4>Native add-on error</h4>}

				{this.props.state == "not-installed" && (
					<p>
						The native application is not installed on this
						computer.
					</p>
				)}
				{this.props.state == "outdated" && (
					<p>
						The native application is outdated and has to be
						reinstalled.
					</p>
				)}
				{this.props.state == "error" && (
					<p>
						The add-on couldn't communicate with the native
						application, so it has to be reinstalled.
					</p>
				)}

				<p>
					Press the button below to download the native application.
				</p>

				{arch.isInstaller && (
					<p>Then, open the downloaded file and install it.</p>
				)}
				{!arch.isInstaller && (
					<p>
						Then, follow the instructions in the{" "}
						<a
							href="https://github.com/kuba2k2/firefox-webserial"
							target="_blank"
						>
							add-on README page
						</a>
						.
					</p>
				)}

				<a
					href={downloadUrl}
					download={
						arch.isInstaller ? arch.file : "firefox-webserial"
					}
					onClick={this.handleDownloadClick}
				>
					<Button text="Download" />
				</a>
				<br />
				<a href={infoUrl} target={"_blank"} style={{ opacity: 0.4 }}>
					See all available downloads
				</a>
			</Container>
		)
	}
}
