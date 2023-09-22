import React from "react"
import { NativeParams } from "../../utils/types"

export class NativeInfo extends React.Component<NativeParams> {
	render() {
		switch (this.props.state) {
			case "outdated":
				return (
					<small>
						Native <b>outdated</b>: v{this.props.version}
					</small>
				)

			case "connected":
				return <small>Native connected: v{this.props.version}</small>

			default:
				return null
		}
	}
}
