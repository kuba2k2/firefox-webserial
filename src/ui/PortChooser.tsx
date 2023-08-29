import React from "react"
import styled from "styled-components"
import { listAvailablePorts } from "../messaging"
import { SerialPortData } from "../serial/types"
import { CommonProps } from "./Common"
import { Button } from "./components/Button"
import { List } from "./components/List"

const MessageContainer = styled.div`
	position: relative;
	min-height: 40px;
	padding-right: 56px;
`

const ReloadButton = styled(Button)`
	position: absolute;
	top: 50%;
	right: 0;
	transform: translateY(-50%);
`

const ButtonContainer = styled.div`
	position: absolute;
	bottom: 12px;
	right: 12px;
`

const ButtonSpacer = styled.span`
	margin-right: 12px;
`

type PortChooserState = {
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
		this.state = { ports: null, active: null }
		this.handleItemClick = this.handleItemClick.bind(this)
		this.handleRefresh = this.handleRefresh.bind(this)
		this.handleOkClick = this.handleOkClick.bind(this)
		this.handleCancelClick = this.handleCancelClick.bind(this)
	}

	handleItemClick(index: number) {
		this.setState({ active: index })
	}

	async handleRefresh() {
		this.setState({ ports: null, active: null })
		try {
			const ports = await listAvailablePorts(
				this.props.origin,
				this.props.options
			)
			this.setState({ ports })
		} catch (error) {
			this.setState({ error })
		}
	}

	handleCancelClick() {
		this.props.reject(new Error("Cancelled by the user"))
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
			<div>
				<MessageContainer>
					<h4>{hostname ?? "A website"}</h4>
					<small>
						wants to connect to a serial port on your computer.
					</small>
					<ReloadButton icon="reload" onClick={this.handleRefresh} />
				</MessageContainer>

				<hr />

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
				{!this.state.ports && !this.state.error && (
					<small>Looking for serial ports...</small>
				)}
				{this.state.error && (
					<small>
						Failed to enumerate serial ports:{" "}
						{`${this.state.error}`}
					</small>
				)}

				<ButtonContainer>
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
			</div>
		)
	}
}
