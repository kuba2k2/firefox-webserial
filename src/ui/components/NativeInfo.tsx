import React from "react"
import styled from "styled-components"
import { NativeParams } from "../../utils/types"

const Text = styled.small`
	margin: 0;
	padding: 0;
`

export class NativeInfo extends React.Component<NativeParams> {
	render() {
		const version = browser.runtime.getManifest().version
		switch (this.props.state) {
			case "outdated":
				return (
					<Text>
						Add-on version: v{version}
						<br />
						Native <b>outdated</b>: v{this.props.version}
					</Text>
				)

			case "connected":
				return (
					<Text>
						Add-on version: v{version}
						<br />
						Native version: v{this.props.version}
					</Text>
				)

			default:
				return null
		}
	}
}
