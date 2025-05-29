import React from "react"
import { getNativeParams, listAvailablePorts } from "../../messaging"
import { SerialPortData } from "../../serial/types"
import { NativeParams } from "../../utils/types"
import {
	ButtonContainer,
	ButtonMessage,
	ButtonSpacer,
	CommonProps,
	ListContainer,
	MainContainer,
	MessageContainer,
	MessageDivider,
	ReloadButton,
} from "../components/Common"
import { NativeInfo } from "../components/NativeInfo"
import { NativeInstaller } from "../components/NativeInstaller"
import { Button } from "../controls/Button"
import { List } from "../controls/List"

type PortChooserState = {
	params: NativeParams | null
	ports: SerialPortData[] | null
	error?: any
	active: number | null
}

export class PortChooser extends React.Component<
	CommonProps,
	PortChooserState
> {
	constructor(props: CommonProps) {
		super(props)
		this.state = { params: null, ports: null, active: null }
		this.handleItemClick = this.handleItemClick.bind(this)
		this.handleRefresh = this.handleRefresh.bind(this)
		this.handleOkClick = this.handleOkClick.bind(this)
		this.handleCancelClick = this.handleCancelClick.bind(this)
	}

	handleItemClick(index: number) {
		this.setState({ active: index })
	}

	async handleRefresh() {
		this.setState({ params: null, ports: null, active: null })
		const params = await getNativeParams()
		try {
			if (params.state !== "connected") {
				this.setState({ params, ports: null })
				return
			}
			const ports = await listAvailablePorts(
				this.props.origin,
				this.props.options
			)
			this.setState({ params, ports })
		} catch (error) {
			this.setState({ params, error })
		}
	}

	handleCancelClick() {
		this.props.reject(new Error("No port selected by the user."))
	}

	handleOkClick() {
		const active = this.state.active
		if (active == null) return
		const port = this.state.ports[active]
		if (!port) return
		this.props.resolve(port)
	}

	componentDidMount() {
		this.handleRefresh()
	}

	render() {
		let hostname: string
		if (this.props.origin) {
			hostname = new URL(this.props.origin).hostname
		}

		return (
			<MainContainer>
				<MessageContainer>
					<h4>{hostname ?? "A website"}</h4>
					<small>
						wants to connect to a serial port on your computer.
					</small>
					<ReloadButton icon="reload" onClick={this.handleRefresh} />
				</MessageContainer>

				<MessageDivider />

				<ListContainer>
					{!this.state.params &&
						!this.state.ports &&
						!this.state.error && (
							<small>Looking for serial ports...</small>
						)}
					{this.state.params && !this.state.ports && (
						<NativeInstaller {...this.state.params} />
					)}
					{this.state.ports && (
						<List
							items={this.state.ports.map(
								(port) => port.description || port.name
							)}
							active={this.state.active}
							onClick={this.handleItemClick}
						/>
					)}
					{this.state.ports && this.state.ports.length == 0 && (
						<small>No serial ports found</small>
					)}
					{this.state.error && (
						<small>
							Failed to enumerate serial ports:{" "}
							{`${this.state.error}`}
						</small>
					)}
				</ListContainer>

				<ButtonContainer>
					<ButtonMessage>
						{this.state.params && (
							<NativeInfo {...this.state.params} />
						)}
					</ButtonMessage>
					<Button text="Cancel" onClick={this.handleCancelClick} />
					<ButtonSpacer />
					<Button
						text="OK"
						isDisabled={
							this.state.active == null || !this.state.ports
						}
						isPrimary={true}
						onClick={this.handleOkClick}
					/>
				</ButtonContainer>
			</MainContainer>
		)
	}
}
