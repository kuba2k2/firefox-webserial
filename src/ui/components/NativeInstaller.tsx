import React from "react"
import styled from "styled-components"
import { NativeParams } from "../../utils/types"
import { Button } from "../controls/Button"

const Container = styled.div`
	text-align: center;
`

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
		const version = browser.runtime.getManifest().version
		const url = browser.runtime.getURL(`firefox-webserial-v${version}.exe`)
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
						There was an error while communicating with the native
						application. Refer to the extension log console for more
						information.
						<br />
						You can also try reinstalling the application.
					</p>
				)}

				<p>
					Press the button below to download the latest version of the
					native application.
					<br />
					Then, open the downloaded file and install it.
				</p>

				<a href={url} onClick={this.handleDownloadClick}>
					<Button text="Download" />
				</a>
			</Container>
		)
	}
}
